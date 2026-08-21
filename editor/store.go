package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

/* ── Data model ─────────────────────────────────────────────────────────── */

type Social struct {
	URL   string `json:"url"`
	Label string `json:"label"`
}

type Shortcut struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
	URL   string `json:"url"`
}

type Folder struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
}

type Post struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Folder  string `json:"folder"`
	Date    string `json:"date"`
	Excerpt string `json:"excerpt"`
	Content string `json:"content"`
}

type Site struct {
	Title     string             `json:"title"`
	Subtitle  string             `json:"subtitle"`
	Social    map[string]*Social `json:"social"`
	Shortcuts []Shortcut         `json:"shortcuts"`
	Folders   []Folder           `json:"folders"`
	Posts     []Post             `json:"posts"`
}

// socialOrder is the preferred key order when writing `social` (Go maps are
// unordered; the site renders with Object.entries so order is visible).
var socialOrder = []string{"github", "instagram", "linkedin"}

/* ── File format ────────────────────────────────────────────────────────── */

const (
	sitePrefix = "const SITE = "
	siteSuffix = "; // ← end of SITE config\n"
)

const defaultHeader = `/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           content.js  —  YOUR CONTENT FILE           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * This file is written by the site editor (editor/). Run it with:
 *     cd editor && go run . -open
 *
 * The data below is plain JSON assigned to a global, so it is also safe to
 * edit by hand — just keep it valid JSON.
 */

`

// isJSONFormat reports whether src looks like the editor's JSON-in-JS format.
func isJSONFormat(src string) bool {
	i := strings.Index(src, sitePrefix)
	if i < 0 {
		return false
	}
	rest := strings.TrimSpace(src[i+len(sitePrefix):])
	if !strings.HasPrefix(rest, "{") {
		return false
	}
	// JSON object keys are quoted; the legacy format used bare keys/comments.
	return strings.HasPrefix(strings.TrimSpace(rest[1:]), "\"")
}

// decodeContentJS splits content.js into its header comment and the Site.
func decodeContentJS(src string) (header string, site *Site, err error) {
	i := strings.Index(src, sitePrefix)
	if i < 0 {
		return "", nil, errors.New("content.js: `const SITE = ` not found")
	}
	header = src[:i]
	body := src[i+len(sitePrefix):]
	end := strings.LastIndex(body, "};")
	if end < 0 {
		return "", nil, errors.New("content.js: closing `};` not found")
	}
	body = body[:end+1]

	site = &Site{}
	dec := json.NewDecoder(strings.NewReader(body))
	if err := dec.Decode(site); err != nil {
		return "", nil, fmt.Errorf("content.js: invalid JSON: %w", err)
	}
	site.normalize()
	return header, site, nil
}

// encodeContentJS renders header + `const SITE = {...};`.
func encodeContentJS(header string, site *Site) ([]byte, error) {
	site.normalize()
	var buf bytes.Buffer
	if header == "" {
		header = defaultHeader
	}
	buf.WriteString(header)
	buf.WriteString(sitePrefix)

	// Encode with a stable social key order by marshalling the map through an
	// ordered intermediate.
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(site.ordered()); err != nil {
		return nil, err
	}
	// Encoder appends "\n"; replace with our suffix.
	buf.Truncate(buf.Len() - 1)
	buf.WriteString(siteSuffix)
	return buf.Bytes(), nil
}

// normalize makes nil slices/maps empty so JSON shows [] / {} not null.
func (s *Site) normalize() {
	if s.Social == nil {
		s.Social = map[string]*Social{}
	}
	if s.Shortcuts == nil {
		s.Shortcuts = []Shortcut{}
	}
	if s.Folders == nil {
		s.Folders = []Folder{}
	}
	if s.Posts == nil {
		s.Posts = []Post{}
	}
}

// orderedSite mirrors Site but with social as an ordered list of pairs so
// the encoder writes keys in a deterministic, human-friendly order.
type orderedSite struct {
	Title     string        `json:"title"`
	Subtitle  string        `json:"subtitle"`
	Social    orderedSocial `json:"social"`
	Shortcuts []Shortcut    `json:"shortcuts"`
	Folders   []Folder      `json:"folders"`
	Posts     []Post        `json:"posts"`
}

type orderedSocial []struct {
	Key string
	Val *Social
}

func (o orderedSocial) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte('{')
	for i, kv := range o {
		if i > 0 {
			buf.WriteByte(',')
		}
		k, _ := json.Marshal(kv.Key)
		v, err := json.Marshal(kv.Val)
		if err != nil {
			return nil, err
		}
		buf.Write(k)
		buf.WriteByte(':')
		buf.Write(v)
	}
	buf.WriteByte('}')
	return buf.Bytes(), nil
}

func (s *Site) ordered() orderedSite {
	seen := map[string]bool{}
	var soc orderedSocial
	add := func(k string) {
		if v, ok := s.Social[k]; ok && !seen[k] {
			seen[k] = true
			soc = append(soc, struct {
				Key string
				Val *Social
			}{k, v})
		}
	}
	for _, k := range socialOrder {
		add(k)
	}
	var rest []string
	for k := range s.Social {
		if !seen[k] {
			rest = append(rest, k)
		}
	}
	sort.Strings(rest)
	for _, k := range rest {
		add(k)
	}
	if soc == nil {
		soc = orderedSocial{}
	}
	return orderedSite{s.Title, s.Subtitle, soc, s.Shortcuts, s.Folders, s.Posts}
}

/* ── Validation ─────────────────────────────────────────────────────────── */

var (
	slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)
	dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
)

// reservedIDs are window ids app.js uses for its own windows.
var reservedIDs = map[string]bool{"about": true, "not-found": true}

// Validate returns a list of human-readable problems (empty == OK).
func (s *Site) Validate() []string {
	var errs []string
	ids := map[string]string{} // id → what owns it

	claim := func(id, what string) {
		if id == "" {
			errs = append(errs, what+": id is required")
			return
		}
		if !slugRe.MatchString(id) {
			errs = append(errs, fmt.Sprintf("%s: id %q must be lowercase letters, digits and dashes", what, id))
		}
		if reservedIDs[id] {
			errs = append(errs, fmt.Sprintf("%s: id %q is reserved", what, id))
		}
		if prev, dup := ids[id]; dup {
			errs = append(errs, fmt.Sprintf("%s: id %q is already used by %s", what, id, prev))
		}
		ids[id] = what
	}

	if strings.TrimSpace(s.Title) == "" {
		errs = append(errs, "site: title is required")
	}
	folderIDs := map[string]bool{}
	for i, f := range s.Folders {
		claim(f.ID, fmt.Sprintf("folder #%d", i+1))
		folderIDs[f.ID] = true
		if strings.TrimSpace(f.Label) == "" {
			errs = append(errs, fmt.Sprintf("folder %q: label is required", f.ID))
		}
	}
	for i, sc := range s.Shortcuts {
		claim(sc.ID, fmt.Sprintf("shortcut #%d", i+1))
		if strings.TrimSpace(sc.URL) == "" {
			errs = append(errs, fmt.Sprintf("shortcut %q: url is required", sc.ID))
		}
	}
	for i, p := range s.Posts {
		what := fmt.Sprintf("post #%d", i+1)
		if p.Title != "" {
			what = fmt.Sprintf("post %q", p.Title)
		}
		claim(p.ID, what)
		if strings.TrimSpace(p.Title) == "" {
			errs = append(errs, what+": title is required")
		}
		if !folderIDs[p.Folder] {
			errs = append(errs, fmt.Sprintf("%s: folder %q does not exist", what, p.Folder))
		}
		if p.Date != "" {
			if !dateRe.MatchString(p.Date) {
				errs = append(errs, fmt.Sprintf("%s: date %q must be YYYY-MM-DD", what, p.Date))
			} else if _, err := time.Parse("2006-01-02", p.Date); err != nil {
				errs = append(errs, fmt.Sprintf("%s: date %q is not a real date", what, p.Date))
			}
		}
	}
	for k, v := range s.Social {
		if v == nil {
			errs = append(errs, fmt.Sprintf("social %q: must not be null (remove it instead)", k))
		} else if strings.TrimSpace(v.URL) == "" {
			errs = append(errs, fmt.Sprintf("social %q: url is required", k))
		}
	}
	return errs
}

// ValidationError carries the list of problems back to the API layer.
type ValidationError struct{ Problems []string }

func (e *ValidationError) Error() string { return strings.Join(e.Problems, "; ") }

/* ── Store ──────────────────────────────────────────────────────────────── */

// Store owns content.js: it serialises access, re-reads the file when it
// changes on disk, validates, backs up and writes atomically.
type Store struct {
	mu         sync.Mutex
	path       string
	backupDir  string
	keepBackup int

	header string
	mtime  time.Time
	size   int64
	site   *Site
}

func NewStore(path, backupDir string) *Store {
	return &Store{path: path, backupDir: backupDir, keepBackup: 50}
}

// Load (re)reads content.js from disk.
func (st *Store) Load() error {
	st.mu.Lock()
	defer st.mu.Unlock()
	return st.loadLocked()
}

func (st *Store) loadLocked() error {
	data, err := os.ReadFile(st.path)
	if err != nil {
		return err
	}
	header, site, err := decodeContentJS(string(data))
	if err != nil {
		return err
	}
	fi, err := os.Stat(st.path)
	if err != nil {
		return err
	}
	st.header, st.site, st.mtime, st.size = header, site, fi.ModTime(), fi.Size()
	return nil
}

// Get returns a deep copy of the current site, reloading if the file changed.
func (st *Store) Get() (*Site, error) {
	st.mu.Lock()
	defer st.mu.Unlock()
	if st.site == nil || st.changedOnDisk() {
		if err := st.loadLocked(); err != nil {
			return nil, err
		}
	}
	return cloneSite(st.site), nil
}

func (st *Store) changedOnDisk() bool {
	fi, err := os.Stat(st.path)
	if err != nil {
		return true
	}
	return !fi.ModTime().Equal(st.mtime) || fi.Size() != st.size
}

// Save validates, backs up the previous file, and atomically replaces it.
func (st *Store) Save(site *Site) error {
	if problems := site.Validate(); len(problems) > 0 {
		return &ValidationError{problems}
	}
	st.mu.Lock()
	defer st.mu.Unlock()

	if st.site == nil {
		_ = st.loadLocked() // best effort, to pick up the header
	}
	out, err := encodeContentJS(st.header, site)
	if err != nil {
		return err
	}
	if err := st.backupLocked(); err != nil {
		return fmt.Errorf("backup: %w", err)
	}
	if err := atomicWrite(st.path, out); err != nil {
		return err
	}
	fi, err := os.Stat(st.path)
	if err != nil {
		return err
	}
	st.site, st.mtime, st.size = cloneSite(site), fi.ModTime(), fi.Size()
	if st.header == "" {
		st.header = defaultHeader
	}
	return nil
}

// Path returns the content.js path.
func (st *Store) Path() string { return st.path }

func (st *Store) backupLocked() error {
	if st.backupDir == "" {
		return nil
	}
	data, err := os.ReadFile(st.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if err := os.MkdirAll(st.backupDir, 0o755); err != nil {
		return err
	}
	name := "content-" + time.Now().Format("20060102-150405.000") + ".js"
	if err := os.WriteFile(filepath.Join(st.backupDir, name), data, 0o644); err != nil {
		return err
	}
	// Prune old backups.
	entries, err := os.ReadDir(st.backupDir)
	if err != nil {
		return nil
	}
	var names []string
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "content-") && strings.HasSuffix(e.Name(), ".js") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	for len(names) > st.keepBackup {
		_ = os.Remove(filepath.Join(st.backupDir, names[0]))
		names = names[1:]
	}
	return nil
}

// atomicWrite writes data to a temp file in the same directory and renames it
// over path, so a crash never leaves a truncated content.js.
func atomicWrite(path string, data []byte) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".content-*.js.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	cleanup := func() { _ = os.Remove(tmpName) }
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return err
	}
	if err := os.Chmod(tmpName, 0o644); err != nil {
		cleanup()
		return err
	}
	if err := os.Rename(tmpName, path); err != nil {
		cleanup()
		return err
	}
	return nil
}

func cloneSite(s *Site) *Site {
	b, _ := json.Marshal(s)
	var c Site
	_ = json.Unmarshal(b, &c)
	c.normalize()
	return &c
}
