package main

// Legacy content.js parser — used only by `-migrate` to convert the old
// hand-written / regex-generated content.js into the JSON-in-JS format that
// store.go reads and writes. Keep this file self-contained; it is not used at
// runtime otherwise.

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

// parseLegacyContentJS reads the old-format content.js.
func parseLegacyContentJS(path string) (*Site, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	src := string(data)
	if isJSONFormat(src) {
		return nil, fmt.Errorf("%s is already in the new format", path)
	}
	s := &Site{
		Title:     extractQuoted(src, "title"),
		Subtitle:  extractQuoted(src, "subtitle"),
		Social:    legacySocials(src),
		Shortcuts: []Shortcut{},
		Folders:   []Folder{},
		Posts:     []Post{},
	}
	for _, obj := range splitObjects(extractArrayBody(src, "shortcuts"), false) {
		sc := Shortcut{ID: extractQuoted(obj, "id"), Label: extractQuoted(obj, "label"), Icon: extractQuoted(obj, "icon"), URL: extractQuoted(obj, "url")}
		if sc.ID != "" {
			s.Shortcuts = append(s.Shortcuts, sc)
		}
	}
	for _, obj := range splitObjects(extractArrayBody(src, "folders"), false) {
		f := Folder{ID: extractQuoted(obj, "id"), Label: extractQuoted(obj, "label"), Icon: extractQuoted(obj, "icon")}
		if f.ID != "" {
			s.Folders = append(s.Folders, f)
		}
	}
	for _, obj := range splitObjects(extractArrayBody(src, "posts"), true) {
		p := Post{
			ID:      extractQuoted(obj, "id"),
			Title:   extractQuoted(obj, "title"),
			Folder:  extractQuoted(obj, "folder"),
			Date:    extractQuoted(obj, "date"),
			Excerpt: extractQuoted(obj, "excerpt"),
			Content: unescapeLegacyContent(extractBacktick(obj, "content")),
		}
		if p.ID != "" {
			s.Posts = append(s.Posts, p)
		}
	}
	return s, nil
}

// unescapeLegacyContent undoes the template-literal escaping the old editor
// applied (and re-applied on every save).
func unescapeLegacyContent(c string) string {
	for strings.Contains(c, "\\`") || strings.Contains(c, "\\${") {
		c = strings.ReplaceAll(c, "\\`", "`")
		c = strings.ReplaceAll(c, "\\${", "${")
	}
	return strings.TrimSpace(c)
}

// legacySocials parses `social: { key: { url, label }, ... }`. Unlike the old
// implementation it scopes the regex to the *inside* of the block, so the
// leading `social:` key can never be mistaken for an entry.
func legacySocials(src string) map[string]*Social {
	out := map[string]*Social{}
	idx := strings.Index(src, "social:")
	if idx < 0 {
		return out
	}
	block := extractBlock(src[idx:], '{', '}')
	if len(block) < 2 {
		return out
	}
	inner := block[strings.Index(block, "{")+1 : len(block)-1]
	re := regexp.MustCompile(`(\w+):\s*\{([^}]*)\}`)
	for _, m := range re.FindAllStringSubmatch(inner, -1) {
		out[m[1]] = &Social{URL: extractQuoted(m[2], "url"), Label: extractQuoted(m[2], "label")}
	}
	return out
}

func extractQuoted(src, key string) string {
	re := regexp.MustCompile(`\b` + regexp.QuoteMeta(key) + `:\s*"([^"]*)"`)
	if m := re.FindStringSubmatch(src); len(m) > 1 {
		return m[1]
	}
	return ""
}

// extractBlock returns from the first open bracket to its matching close.
func extractBlock(src string, open, close byte) string {
	depth := 0
	inStr := false
	var strChar byte
	for i := 0; i < len(src); i++ {
		c := src[i]
		if inStr {
			if c == '\\' {
				i++
				continue
			}
			if c == strChar {
				inStr = false
			}
			continue
		}
		switch c {
		case '"', '\'', '`':
			inStr = true
			strChar = c
		default:
			if c == open {
				depth++
			} else if c == close {
				depth--
				if depth == 0 {
					return src[:i+1]
				}
			}
		}
	}
	return src
}

// extractArrayBody returns the content inside "key: [...]".
func extractArrayBody(src, key string) string {
	idx := strings.Index(src, key+":")
	if idx < 0 {
		return ""
	}
	rest := src[idx:]
	start := strings.Index(rest, "[")
	if start < 0 {
		return ""
	}
	block := extractBlock(rest[start:], '[', ']')
	if len(block) < 2 {
		return ""
	}
	return block[1 : len(block)-1]
}

// splitObjects splits an array body into individual { ... } strings.
// withBackticks=true handles template literals inside object values.
func splitObjects(src string, withBackticks bool) []string {
	var objects []string
	depth := 0
	start := -1
	inStr := false
	var strChar byte
	for i := 0; i < len(src); i++ {
		c := src[i]
		if inStr {
			if c == '\\' && strChar != '`' {
				i++
				continue
			}
			if c == strChar {
				inStr = false
			}
			continue
		}
		switch c {
		case '"', '\'':
			inStr = true
			strChar = c
		case '`':
			if withBackticks {
				inStr = true
				strChar = '`'
			}
		case '{':
			if depth == 0 {
				start = i
			}
			depth++
		case '}':
			depth--
			if depth == 0 && start >= 0 {
				objects = append(objects, src[start:i+1])
				start = -1
			}
		}
	}
	return objects
}

// extractBacktick extracts a backtick-delimited field value.
func extractBacktick(src, key string) string {
	idx := strings.Index(src, key+":")
	if idx < 0 {
		return ""
	}
	rest := src[idx+len(key)+1:]
	bt := strings.Index(rest, "`")
	if bt < 0 {
		return ""
	}
	for i := bt + 1; i < len(rest); i++ {
		if rest[i] == '\\' {
			i++
			continue
		}
		if rest[i] == '`' {
			return rest[bt+1 : i]
		}
	}
	return ""
}
