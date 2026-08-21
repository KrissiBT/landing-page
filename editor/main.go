// site-editor — a local editor for the XP-desktop portfolio's content.js.
//
//	cd editor && go run . -open
//
// Flags:
//
//	-port        TCP port on 127.0.0.1 (default 8080)
//	-content     path to content.js (default ../content.js)
//	-open        open the editor in your browser on start
//	-migrate     convert a legacy content.js to the JSON format and exit
//	-deploy-cmd  shell command run after a successful `git push` (optional)
package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed ui
var uiFS embed.FS

type app struct {
	store     *Store
	siteRoot  string // directory containing index.html / content.js / assets
	imagesDir string
	deployCmd string
}

func main() {
	var (
		port      = flag.Int("port", 8080, "port to listen on (127.0.0.1 only)")
		content   = flag.String("content", "../content.js", "path to content.js")
		open      = flag.Bool("open", false, "open the editor in a browser")
		migrate   = flag.Bool("migrate", false, "convert a legacy content.js to the JSON format, then exit")
		deployCmd = flag.String("deploy-cmd", os.Getenv("DEPLOY_CMD"), "shell command to run after git push")
	)
	flag.Parse()

	contentPath, err := filepath.Abs(*content)
	if err != nil {
		log.Fatal(err)
	}
	siteRoot := filepath.Dir(contentPath)
	backupDir := filepath.Join(siteRoot, "editor", "backups")
	store := NewStore(contentPath, backupDir)

	if *migrate {
		if err := runMigration(store); err != nil {
			log.Fatalf("migration failed: %v", err)
		}
		return
	}

	if err := store.Load(); err != nil {
		if data, rerr := os.ReadFile(contentPath); rerr == nil && !isJSONFormat(string(data)) {
			log.Fatalf("%s is in the legacy format. Run:  go run . -migrate  (a backup is written first)", contentPath)
		}
		log.Fatalf("cannot load %s: %v", contentPath, err)
	}

	a := &app{
		store:     store,
		siteRoot:  siteRoot,
		imagesDir: filepath.Join(siteRoot, "assets", "images"),
		deployCmd: *deployCmd,
	}

	mux := http.NewServeMux()
	a.routes(mux)

	addr := net.JoinHostPort("127.0.0.1", fmt.Sprint(*port))
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("listen %s: %v", addr, err)
	}
	url := "http://" + addr + "/"
	log.Printf("Site editor running at %s  (content: %s)", url, contentPath)
	if *open {
		openBrowser(url)
	}
	log.Fatal(http.Serve(ln, noCache(mux)))
}

func (a *app) routes(mux *http.ServeMux) {
	// Editor UI (embedded).
	sub, err := fs.Sub(uiFS, "ui")
	if err != nil {
		log.Fatal(err)
	}
	mux.Handle("/", http.FileServer(http.FS(sub)))

	// The real site, served so the preview iframe can load it (and its images).
	mux.Handle("/site/", http.StripPrefix("/site/", http.FileServer(http.Dir(a.siteRoot))))

	// JSON API.
	mux.HandleFunc("/api/site", a.handleSite)
	mux.HandleFunc("/api/images", a.handleImages)
	mux.HandleFunc("/api/images/", a.handleImageDelete)
	mux.HandleFunc("/api/upload", a.handleUpload)
	mux.HandleFunc("/api/git/status", a.handleGitStatus)
	mux.HandleFunc("/api/git/commit", a.handleGitCommit)
	mux.HandleFunc("/api/git/push", a.handleGitPush)
}

// noCache stops browsers from caching the site or the editor while editing.
func noCache(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func runMigration(store *Store) error {
	path := store.Path()
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if isJSONFormat(string(data)) {
		fmt.Println("Already in the new format — nothing to do.")
		return nil
	}
	site, err := parseLegacyContentJS(path)
	if err != nil {
		return err
	}
	if problems := site.Validate(); len(problems) > 0 {
		return fmt.Errorf("parsed content is not valid:\n  %s", strings.Join(problems, "\n  "))
	}
	if err := store.Save(site); err != nil {
		return err
	}
	fmt.Printf("Migrated %s\n  title:     %q\n  social:    %d\n  shortcuts: %d\n  folders:   %d\n  posts:     %d\nBackup of the old file is in editor/backups/.\n",
		path, site.Title, len(site.Social), len(site.Shortcuts), len(site.Folders), len(site.Posts))
	return nil
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		log.Printf("could not open browser: %v", err)
	}
}
