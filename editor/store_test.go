package main

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func sampleSite() *Site {
	return &Site{
		Title:    `Kristofer's "Desktop"`,
		Subtitle: "3D · Electronics",
		Social: map[string]*Social{
			"linkedin":  {URL: "https://l", Label: "LinkedIn"},
			"github":    {URL: "https://g", Label: "GitHub"},
			"mastodon":  {URL: "https://m", Label: "Mastodon"},
			"instagram": {URL: "https://i", Label: "Instagram"},
		},
		Shortcuts: []Shortcut{{ID: "qr", Label: "QR", Icon: "🔳", URL: "http://x/qr/"}},
		Folders:   []Folder{{ID: "3d-printing", Label: "3D Printing", Icon: "🖨️"}},
		Posts: []Post{{
			ID: "tricky", Title: `Quotes "and" back\slashes`, Folder: "3d-printing", Date: "2024-01-15",
			Excerpt: "x",
			Content: "<h2>Hi</h2>\n<pre><code>const s = `tmpl ${x}`;\n</code></pre>\n<p>Emoji 🎉 &amp; </script> tags</p>",
		}},
	}
}

func TestRoundTrip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "content.js")
	st := NewStore(path, filepath.Join(dir, "backups"))

	want := sampleSite()
	if err := st.Save(want); err != nil {
		t.Fatalf("save: %v", err)
	}
	// Fresh store reads it back identically.
	st2 := NewStore(path, filepath.Join(dir, "backups"))
	got, err := st2.Get()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("round trip mismatch:\n got %+v\nwant %+v", got, want)
	}
	// Second save is byte-identical (no escape growth).
	if err := st2.Save(got); err != nil {
		t.Fatalf("save2: %v", err)
	}
	a, _ := os.ReadFile(path)
	if err := st2.Save(got); err != nil {
		t.Fatalf("save3: %v", err)
	}
	b, _ := os.ReadFile(path)
	if string(a) != string(b) {
		t.Fatalf("saving twice changed the file")
	}
	src := string(a)
	if !strings.HasPrefix(src, defaultHeader) {
		t.Errorf("default header missing")
	}
	if !strings.HasSuffix(src, siteSuffix) {
		t.Errorf("suffix missing")
	}
	if strings.Contains(src, `\u003c`) {
		t.Errorf("HTML should not be escaped: %s", src)
	}
	// Social keys in preferred order, extras sorted after.
	gi, ii, li, mi := strings.Index(src, `"github"`), strings.Index(src, `"instagram"`), strings.Index(src, `"linkedin"`), strings.Index(src, `"mastodon"`)
	if !(gi < ii && ii < li && li < mi) {
		t.Errorf("social order wrong: %d %d %d %d", gi, ii, li, mi)
	}
	// No temp files left behind.
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".tmp") {
			t.Errorf("temp file left: %s", e.Name())
		}
	}
	// Backups created (save 2 and 3 had a previous file).
	bk, _ := os.ReadDir(filepath.Join(dir, "backups"))
	if len(bk) != 2 {
		t.Errorf("expected 2 backups, got %d", len(bk))
	}
}

func TestHeaderPreserved(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "content.js")
	custom := "/* my own header */\n\n"
	data, err := encodeContentJS(custom, sampleSite())
	if err != nil {
		t.Fatal(err)
	}
	os.WriteFile(path, data, 0o644)
	st := NewStore(path, "")
	s, err := st.Get()
	if err != nil {
		t.Fatal(err)
	}
	s.Title = "changed"
	if err := st.Save(s); err != nil {
		t.Fatal(err)
	}
	out, _ := os.ReadFile(path)
	if !strings.HasPrefix(string(out), custom) {
		t.Fatalf("header not preserved: %q", string(out)[:40])
	}
}

func TestReloadWhenChangedOnDisk(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "content.js")
	st := NewStore(path, "")
	if err := st.Save(sampleSite()); err != nil {
		t.Fatal(err)
	}
	s2 := sampleSite()
	s2.Title = "edited by hand"
	data, _ := encodeContentJS("", s2)
	// Ensure mtime/size differ.
	os.WriteFile(path, append(data, '\n'), 0o644)
	got, err := st.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.Title != "edited by hand" {
		t.Fatalf("stale snapshot: %q", got.Title)
	}
}

func TestValidate(t *testing.T) {
	cases := []struct {
		name string
		mut  func(*Site)
		want string
	}{
		{"dup id", func(s *Site) { s.Posts = append(s.Posts, Post{ID: "3d-printing", Title: "x", Folder: "3d-printing"}) }, "already used"},
		{"bad slug", func(s *Site) { s.Posts[0].ID = "Has Space" }, "lowercase"},
		{"reserved", func(s *Site) { s.Posts[0].ID = "about" }, "reserved"},
		{"missing folder", func(s *Site) { s.Posts[0].Folder = "nope" }, "does not exist"},
		{"bad date", func(s *Site) { s.Posts[0].Date = "15/01/2024" }, "YYYY-MM-DD"},
		{"fake date", func(s *Site) { s.Posts[0].Date = "2024-13-45" }, "not a real date"},
		{"empty title", func(s *Site) { s.Title = " " }, "title is required"},
		{"null social", func(s *Site) { s.Social["x"] = nil }, "null"},
	}
	for _, c := range cases {
		s := sampleSite()
		c.mut(s)
		errs := s.Validate()
		if len(errs) == 0 || !strings.Contains(strings.Join(errs, "|"), c.want) {
			t.Errorf("%s: expected error containing %q, got %v", c.name, c.want, errs)
		}
	}
	if errs := sampleSite().Validate(); len(errs) != 0 {
		t.Errorf("valid site reported errors: %v", errs)
	}
	st := NewStore(filepath.Join(t.TempDir(), "c.js"), "")
	bad := sampleSite()
	bad.Posts[0].Folder = "nope"
	var ve *ValidationError
	if err := st.Save(bad); err == nil {
		t.Fatal("expected validation error")
	} else if !errorAs(err, &ve) {
		t.Fatalf("expected *ValidationError, got %T", err)
	}
}

func errorAs(err error, target **ValidationError) bool {
	v, ok := err.(*ValidationError)
	if ok {
		*target = v
	}
	return ok
}

func TestMigrateLegacy(t *testing.T) {
	legacy := "/**\n * header\n */\n\nconst SITE = {\n" +
		"  title: \"MuhCodes Workshop\",\n  subtitle: \"3D\",\n" +
		"  social: {\n    github:    { url: \"https://github.com/x\",  label: \"GitHub\"    },\n" +
		"    instagram: { url: \"https://ig/x\", label: \"Instagram\" },\n  },\n" +
		"  shortcuts: [\n    { id: \"\", label: \"\", icon: \"\", url: \"\" },\n    { id: \"qr\", label: \"QR\", icon: \"🔳\", url: \"http://x/qr/\" },\n  ],\n" +
		"  folders: [\n    { id: \"3d-printing\",  label: \"3D Printing\",  icon: \"🖨️\" },\n  ],\n" +
		"  posts: [\n    {\n      id:      \"p1\",\n      title:   \"First\",\n      folder:  \"3d-printing\",\n      date:    \"2024-01-15\",\n      excerpt: \"e\",\n" +
		"      content: `\n        <h2>Hi</h2>\n        <pre><code>x = \\`a\\` \\${y}</code></pre>\n      `\n    },\n  ],\n\n}; // ← end of SITE config\n"
	path := filepath.Join(t.TempDir(), "content.js")
	os.WriteFile(path, []byte(legacy), 0o644)

	s, err := parseLegacyContentJS(path)
	if err != nil {
		t.Fatal(err)
	}
	if s.Title != "MuhCodes Workshop" {
		t.Errorf("title: %q", s.Title)
	}
	if _, ok := s.Social["github"]; !ok || len(s.Social) != 2 {
		t.Errorf("social keys wrong: %v", s.Social)
	}
	if _, bad := s.Social["social"]; bad {
		t.Errorf("legacy social-key bug reproduced")
	}
	if len(s.Shortcuts) != 1 || s.Shortcuts[0].ID != "qr" {
		t.Errorf("shortcuts: %+v", s.Shortcuts)
	}
	if len(s.Folders) != 1 || len(s.Posts) != 1 {
		t.Errorf("folders/posts: %d/%d", len(s.Folders), len(s.Posts))
	}
	if strings.Contains(s.Posts[0].Content, "\\`") || strings.Contains(s.Posts[0].Content, "\\${") {
		t.Errorf("escapes not removed: %q", s.Posts[0].Content)
	}
	if !strings.Contains(s.Posts[0].Content, "`a` ${y}") {
		t.Errorf("content: %q", s.Posts[0].Content)
	}
	if errs := s.Validate(); len(errs) != 0 {
		t.Errorf("migrated site invalid: %v", errs)
	}
}
