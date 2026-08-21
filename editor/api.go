package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

const maxUploadBytes = 20 << 20 // 20 MB per request

/* ── helpers ───────────────────────────────────────────────────────────── */

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"ok": false, "error": msg})
}

func methodIs(w http.ResponseWriter, r *http.Request, methods ...string) bool {
	for _, m := range methods {
		if r.Method == m {
			return true
		}
	}
	w.Header().Set("Allow", strings.Join(methods, ", "))
	writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
	return false
}

/* ── /api/site ─────────────────────────────────────────────────────────── */

func (a *app) handleSite(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		site, err := a.store.Get()
		if err != nil {
			writeErr(w, 500, err.Error())
			return
		}
		writeJSON(w, 200, site)

	case http.MethodPut:
		var site Site
		dec := json.NewDecoder(io.LimitReader(r.Body, 50<<20))
		if err := dec.Decode(&site); err != nil {
			writeErr(w, 400, "invalid JSON: "+err.Error())
			return
		}
		if err := a.store.Save(&site); err != nil {
			var ve *ValidationError
			if errors.As(err, &ve) {
				writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"ok": false, "errors": ve.Problems})
				return
			}
			writeErr(w, 500, err.Error())
			return
		}
		writeJSON(w, 200, map[string]any{"ok": true, "savedAt": time.Now().Format(time.RFC3339)})

	default:
		methodIs(w, r, http.MethodGet, http.MethodPut)
	}
}

/* ── images ────────────────────────────────────────────────────────────── */

type imageInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"` // relative to the site root, e.g. assets/images/x.jpg
	Size    int64  `json:"size"`
	ModTime string `json:"modTime"`
}

var imageExts = map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true, ".svg": true, ".avif": true}

func (a *app) listImages() ([]imageInfo, error) {
	entries, err := os.ReadDir(a.imagesDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []imageInfo{}, nil
		}
		return nil, err
	}
	out := []imageInfo{}
	for _, e := range entries {
		if e.IsDir() || !imageExts[strings.ToLower(filepath.Ext(e.Name()))] {
			continue
		}
		fi, err := e.Info()
		if err != nil {
			continue
		}
		out = append(out, imageInfo{
			Name:    e.Name(),
			Path:    "assets/images/" + e.Name(),
			Size:    fi.Size(),
			ModTime: fi.ModTime().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ModTime > out[j].ModTime })
	return out, nil
}

func (a *app) handleImages(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodGet) {
		return
	}
	imgs, err := a.listImages()
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, imgs)
}

func (a *app) handleImageDelete(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodDelete) {
		return
	}
	name := filepath.Base(strings.TrimPrefix(r.URL.Path, "/api/images/"))
	if name == "" || name == "." || name == "/" || !imageExts[strings.ToLower(filepath.Ext(name))] {
		writeErr(w, 400, "bad image name")
		return
	}
	if err := os.Remove(filepath.Join(a.imagesDir, name)); err != nil {
		if os.IsNotExist(err) {
			writeErr(w, 404, "no such image")
			return
		}
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

var unsafeChars = regexp.MustCompile(`[^a-z0-9._-]+`)

// safeImageName lowercases and slugifies a filename, keeping its extension.
func safeImageName(name string) string {
	name = filepath.Base(name)
	ext := strings.ToLower(filepath.Ext(name))
	base := strings.TrimSuffix(name, filepath.Ext(name))
	base = unsafeChars.ReplaceAllString(strings.ToLower(base), "-")
	base = strings.Trim(base, "-.")
	if base == "" {
		base = "image"
	}
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	return base + ext
}

// uniquePath returns dir/name, adding -2, -3 … if the name is taken.
func uniquePath(dir, name string) string {
	p := filepath.Join(dir, name)
	if _, err := os.Stat(p); os.IsNotExist(err) {
		return p
	}
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 2; ; i++ {
		p = filepath.Join(dir, fmt.Sprintf("%s-%d%s", base, i, ext))
		if _, err := os.Stat(p); os.IsNotExist(err) {
			return p
		}
	}
}

func (a *app) handleUpload(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodPost) {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		writeErr(w, 400, "upload too large or malformed (max 20 MB)")
		return
	}
	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		writeErr(w, 400, "no files in field 'file'")
		return
	}
	if err := os.MkdirAll(a.imagesDir, 0o755); err != nil {
		writeErr(w, 500, err.Error())
		return
	}

	var saved []imageInfo
	for _, fh := range files {
		f, err := fh.Open()
		if err != nil {
			writeErr(w, 400, err.Error())
			return
		}
		data, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			writeErr(w, 400, err.Error())
			return
		}
		name := safeImageName(fh.Filename)
		if !imageExts[filepath.Ext(name)] {
			writeErr(w, 400, fmt.Sprintf("%s: unsupported file type", fh.Filename))
			return
		}
		if filepath.Ext(name) != ".svg" {
			ct := http.DetectContentType(data)
			if !strings.HasPrefix(ct, "image/") {
				writeErr(w, 400, fmt.Sprintf("%s: not an image (%s)", fh.Filename, ct))
				return
			}
		}
		dst := uniquePath(a.imagesDir, name)
		if err := os.WriteFile(dst, data, 0o644); err != nil {
			writeErr(w, 500, err.Error())
			return
		}
		fi, _ := os.Stat(dst)
		saved = append(saved, imageInfo{
			Name:    filepath.Base(dst),
			Path:    "assets/images/" + filepath.Base(dst),
			Size:    fi.Size(),
			ModTime: fi.ModTime().Format(time.RFC3339),
		})
	}
	writeJSON(w, 200, map[string]any{"ok": true, "files": saved})
}
