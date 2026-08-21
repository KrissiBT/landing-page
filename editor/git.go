package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
)

// gitMu serialises git operations; two concurrent commits would race on the
// index lock.
var gitMu sync.Mutex

func (a *app) git(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = a.siteRoot
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	err := cmd.Run()
	return strings.TrimSpace(out.String()), err
}

type gitStatus struct {
	Available bool       `json:"available"`
	Branch    string     `json:"branch"`
	Ahead     int        `json:"ahead"`
	Behind    int        `json:"behind"`
	Dirty     []string   `json:"dirty"` // managed files (content.js, assets/images) with changes
	Other     int        `json:"other"` // changed files the editor does not stage
	Last      *gitCommit `json:"last,omitempty"`
	Error     string     `json:"error,omitempty"`
}

type gitCommit struct {
	Hash    string `json:"hash"`
	Subject string `json:"subject"`
	When    string `json:"when"`
}

func (a *app) status() gitStatus {
	st := gitStatus{Dirty: []string{}}
	out, err := a.git("status", "--porcelain=v1", "-b")
	if err != nil {
		st.Error = out
		return st
	}
	st.Available = true
	for i, line := range strings.Split(out, "\n") {
		if i == 0 && strings.HasPrefix(line, "## ") {
			// e.g. "## main...origin/main [ahead 1, behind 2]"
			head := strings.TrimPrefix(line, "## ")
			if j := strings.Index(head, "..."); j >= 0 {
				st.Branch = head[:j]
				if k := strings.Index(head, "["); k >= 0 {
					for _, part := range strings.Split(strings.Trim(head[k:], "[]"), ",") {
						f := strings.Fields(part)
						if len(f) == 2 {
							n, _ := strconv.Atoi(f[1])
							if f[0] == "ahead" {
								st.Ahead = n
							} else if f[0] == "behind" {
								st.Behind = n
							}
						}
					}
				}
			} else {
				st.Branch = strings.Fields(head)[0]
			}
			continue
		}
		if strings.TrimSpace(line) == "" {
			continue
		}
		if isManagedPath(line) {
			st.Dirty = append(st.Dirty, line)
		} else {
			st.Other++
		}
	}
	if out, err := a.git("log", "-1", "--format=%h%x00%s%x00%cr"); err == nil {
		parts := strings.SplitN(out, "\x00", 3)
		if len(parts) == 3 {
			st.Last = &gitCommit{Hash: parts[0], Subject: parts[1], When: parts[2]}
		}
	}
	return st
}

// isManagedPath reports whether a porcelain status line refers to a file the
// editor stages on commit.
func isManagedPath(line string) bool {
	if len(line) < 4 {
		return false
	}
	path := strings.TrimSpace(line[3:])
	if i := strings.Index(path, " -> "); i >= 0 { // renames
		path = path[i+4:]
	}
	path = strings.Trim(path, "\"")
	return path == "content.js" || strings.HasPrefix(path, "assets/images/") || path == "assets/images"
}

func (a *app) handleGitStatus(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodGet) {
		return
	}
	gitMu.Lock()
	defer gitMu.Unlock()
	writeJSON(w, 200, a.status())
}

func (a *app) handleGitCommit(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodPost) {
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Message) == "" {
		writeErr(w, 400, "a commit message is required")
		return
	}
	gitMu.Lock()
	defer gitMu.Unlock()

	var log []string
	// Only stage what the editor manages.
	out, err := a.git("add", "--", "content.js", "assets/images")
	log = append(log, "$ git add -- content.js assets/images", out)
	if err != nil {
		writeJSON(w, 500, map[string]any{"ok": false, "log": log, "error": "git add failed"})
		return
	}
	out, err = a.git("commit", "-m", body.Message)
	log = append(log, "$ git commit -m "+strconv.Quote(body.Message), out)
	if err != nil {
		writeJSON(w, 409, map[string]any{"ok": false, "log": log, "error": "nothing to commit or commit failed"})
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "log": log, "status": a.status()})
}

func (a *app) handleGitPush(w http.ResponseWriter, r *http.Request) {
	if !methodIs(w, r, http.MethodPost) {
		return
	}
	gitMu.Lock()
	defer gitMu.Unlock()

	var log []string
	out, err := a.git("push")
	log = append(log, "$ git push", out)
	if err != nil {
		writeJSON(w, 500, map[string]any{"ok": false, "log": log, "error": "git push failed"})
		return
	}
	if a.deployCmd != "" {
		start := time.Now()
		cmd := exec.Command("sh", "-c", a.deployCmd)
		cmd.Dir = a.siteRoot
		var buf bytes.Buffer
		cmd.Stdout, cmd.Stderr = &buf, &buf
		derr := cmd.Run()
		log = append(log, "$ "+a.deployCmd, strings.TrimSpace(buf.String()), "(deploy took "+time.Since(start).Round(time.Millisecond).String()+")")
		if derr != nil {
			writeJSON(w, 500, map[string]any{"ok": false, "log": log, "error": "deploy command failed"})
			return
		}
	}
	writeJSON(w, 200, map[string]any{"ok": true, "log": log, "status": a.status()})
}
