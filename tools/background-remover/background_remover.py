"""
Background Remover Tool
=======================
A Windows GUI tool to remove backgrounds from images using AI (rembg/U2Net).
Supports PNG, JPG, JPEG, BMP, WEBP input formats.
Output is always PNG with transparent background.

Requirements: pip install -r requirements.txt
"""

import os
import sys
import threading
from pathlib import Path
from tkinter import (
    Tk, Label, Button, Frame, filedialog, messagebox,
    StringVar, OptionMenu, Canvas, Scrollbar, HORIZONTAL, VERTICAL, BOTH, NW
)
from tkinter.ttk import Progressbar, Style

# When running as a PyInstaller bundle, set the .u2net model path
# so rembg finds the bundled model files
if getattr(sys, 'frozen', False):
    _bundle_dir = Path(sys._MEIPASS)  # type: ignore[attr-defined]
    _u2net_dir = _bundle_dir / ".u2net"
    if _u2net_dir.exists():
        os.environ["U2NET_HOME"] = str(_u2net_dir)

try:
    from PIL import Image, ImageTk
except ImportError:
    sys.exit("Pillow is required. Install with: pip install Pillow")

try:
    from rembg import remove, new_session
except ImportError:
    sys.exit("rembg is required. Install with: pip install rembg[cpu]")


SUPPORTED_FORMATS = [
    ("Image files", "*.png *.jpg *.jpeg *.bmp *.webp"),
    ("PNG", "*.png"),
    ("JPEG", "*.jpg *.jpeg"),
    ("BMP", "*.bmp"),
    ("WebP", "*.webp"),
    ("All files", "*.*"),
]

MODELS = [
    "u2net",
    "u2netp",
    "u2net_human_seg",
    "isnet-general-use",
    "isnet-anime",
    "silueta",
]

MAX_PREVIEW_SIZE = 500


class BackgroundRemoverApp:
    def __init__(self, root: Tk):
        self.root = root
        self.root.title("Background Remover")
        self.root.geometry("1100x700")
        self.root.minsize(800, 500)

        self.input_path: str | None = None
        self.output_image: Image.Image | None = None
        self.session = None

        style = Style()
        style.configure("TProgressbar", thickness=20)

        self._build_ui()

    def _build_ui(self):
        # Top toolbar
        toolbar = Frame(self.root, padx=10, pady=10)
        toolbar.pack(fill="x")

        Button(toolbar, text="Bild oeffnen", command=self._open_image,
               width=14, bg="#4CAF50", fg="white", font=("Segoe UI", 10, "bold")
               ).pack(side="left", padx=(0, 5))

        Label(toolbar, text="Modell:", font=("Segoe UI", 10)).pack(side="left", padx=(10, 2))
        self.model_var = StringVar(value="u2net")
        OptionMenu(toolbar, self.model_var, *MODELS).pack(side="left", padx=(0, 10))

        self.remove_btn = Button(
            toolbar, text="Hintergrund entfernen", command=self._start_removal,
            width=22, bg="#FF2D55", fg="white", font=("Segoe UI", 10, "bold"),
            state="disabled"
        )
        self.remove_btn.pack(side="left", padx=(0, 5))

        self.save_btn = Button(
            toolbar, text="Speichern unter...", command=self._save_image,
            width=16, bg="#2196F3", fg="white", font=("Segoe UI", 10, "bold"),
            state="disabled"
        )
        self.save_btn.pack(side="left", padx=(0, 5))

        # Status
        self.status_var = StringVar(value="Bitte ein Bild oeffnen.")
        Label(toolbar, textvariable=self.status_var, font=("Segoe UI", 9),
              fg="#666").pack(side="right")

        # Progress bar
        self.progress = Progressbar(self.root, mode="indeterminate", style="TProgressbar")
        self.progress.pack(fill="x", padx=10)

        # Preview area
        preview_frame = Frame(self.root)
        preview_frame.pack(fill=BOTH, expand=True, padx=10, pady=(5, 10))

        # Left: Original
        left = Frame(preview_frame, bd=1, relief="sunken")
        left.pack(side="left", fill=BOTH, expand=True, padx=(0, 5))
        Label(left, text="Original", font=("Segoe UI", 10, "bold"), bg="#f0f0f0").pack(fill="x")
        self.canvas_left = Canvas(left, bg="#e0e0e0")
        self.canvas_left.pack(fill=BOTH, expand=True)

        # Right: Result
        right = Frame(preview_frame, bd=1, relief="sunken")
        right.pack(side="right", fill=BOTH, expand=True, padx=(5, 0))
        Label(right, text="Ergebnis (ohne Hintergrund)", font=("Segoe UI", 10, "bold"),
              bg="#f0f0f0").pack(fill="x")
        self.canvas_right = Canvas(right, bg="#e0e0e0")
        self.canvas_right.pack(fill=BOTH, expand=True)

        # Store PhotoImage references to prevent garbage collection
        self._photo_left = None
        self._photo_right = None

    def _open_image(self):
        path = filedialog.askopenfilename(
            title="Bild auswaehlen",
            filetypes=SUPPORTED_FORMATS
        )
        if not path:
            return

        self.input_path = path
        self.output_image = None
        self.save_btn.config(state="disabled")

        try:
            img = Image.open(path)
            self._show_preview(img, "left")
            self._clear_canvas("right")
            self.remove_btn.config(state="normal")
            self.status_var.set(f"Geladen: {Path(path).name}  ({img.width}x{img.height})")
        except Exception as e:
            messagebox.showerror("Fehler", f"Bild konnte nicht geladen werden:\n{e}")

    def _show_preview(self, img: Image.Image, side: str):
        preview = img.copy()
        preview.thumbnail((MAX_PREVIEW_SIZE, MAX_PREVIEW_SIZE), Image.LANCZOS)

        # Draw checkerboard for transparency
        if preview.mode == "RGBA":
            checker = self._make_checkerboard(preview.width, preview.height)
            checker.paste(preview, mask=preview.split()[3])
            preview = checker

        photo = ImageTk.PhotoImage(preview)
        canvas = self.canvas_left if side == "left" else self.canvas_right
        canvas.delete("all")
        canvas.create_image(
            canvas.winfo_width() // 2 or MAX_PREVIEW_SIZE // 2,
            canvas.winfo_height() // 2 or MAX_PREVIEW_SIZE // 2,
            anchor="center", image=photo
        )

        if side == "left":
            self._photo_left = photo
        else:
            self._photo_right = photo

    def _clear_canvas(self, side: str):
        canvas = self.canvas_left if side == "left" else self.canvas_right
        canvas.delete("all")
        if side == "left":
            self._photo_left = None
        else:
            self._photo_right = None

    @staticmethod
    def _make_checkerboard(w: int, h: int, square: int = 10) -> Image.Image:
        img = Image.new("RGB", (w, h))
        pixels = img.load()
        for y in range(h):
            for x in range(w):
                if (x // square + y // square) % 2 == 0:
                    pixels[x, y] = (255, 255, 255)
                else:
                    pixels[x, y] = (200, 200, 200)
        return img

    def _start_removal(self):
        if not self.input_path:
            return

        self.remove_btn.config(state="disabled")
        self.save_btn.config(state="disabled")
        self.status_var.set("Hintergrund wird entfernt... bitte warten.")
        self.progress.start(15)

        thread = threading.Thread(target=self._do_removal, daemon=True)
        thread.start()

    def _do_removal(self):
        try:
            model_name = self.model_var.get()
            session = new_session(model_name)

            img = Image.open(self.input_path)
            result = remove(img, session=session)
            self.output_image = result

            self.root.after(0, self._on_removal_done)
        except Exception as e:
            self.root.after(0, lambda: self._on_removal_error(str(e)))

    def _on_removal_done(self):
        self.progress.stop()
        self._show_preview(self.output_image, "right")
        self.remove_btn.config(state="normal")
        self.save_btn.config(state="normal")
        self.status_var.set("Fertig! Ergebnis kann gespeichert werden.")

    def _on_removal_error(self, error: str):
        self.progress.stop()
        self.remove_btn.config(state="normal")
        self.status_var.set("Fehler bei der Verarbeitung.")
        messagebox.showerror("Fehler", f"Hintergrundentfernung fehlgeschlagen:\n{error}")

    def _save_image(self):
        if self.output_image is None:
            return

        default_name = Path(self.input_path).stem + "_freigestellt.png"
        path = filedialog.asksaveasfilename(
            title="Ergebnis speichern",
            defaultextension=".png",
            initialfile=default_name,
            filetypes=[("PNG (transparent)", "*.png"), ("All files", "*.*")]
        )
        if not path:
            return

        try:
            self.output_image.save(path, "PNG")
            self.status_var.set(f"Gespeichert: {Path(path).name}")
            messagebox.showinfo("Gespeichert", f"Bild wurde gespeichert:\n{path}")
        except Exception as e:
            messagebox.showerror("Fehler", f"Speichern fehlgeschlagen:\n{e}")


def main():
    root = Tk()
    app = BackgroundRemoverApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
