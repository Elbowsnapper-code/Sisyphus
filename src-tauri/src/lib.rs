use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn write_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if path.is_empty() {
        return Err("Missing path".into());
    }
    let resolved = PathBuf::from(&path);
    fs::write(&resolved, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
fn join_path(folder: String, name: String) -> Result<String, String> {
    if folder.is_empty() {
        return Err("Missing folder".into());
    }
    let leaf = Path::new(&name)
        .file_name()
        .ok_or_else(|| "Missing name".to_string())?;
    Ok(Path::new(&folder).join(leaf).to_string_lossy().into_owned())
}

#[tauri::command]
fn open_aux(app: AppHandle, hash: String) -> Result<(), String> {
    let label = if hash == "dashboard" { "dashboard" } else { "preview" };
    if app.get_webview_window(label).is_some() {
        if let Some(win) = app.get_webview_window(label) {
            let _ = win.set_focus();
        }
        return Ok(());
    }
    let url = format!("index.html#{hash}");
    let title = if hash == "dashboard" {
        "Series Dashboard"
    } else {
        "Book preview"
    };
    WebviewWindowBuilder::new(&app, label, WebviewUrl::App(url.into()))
        .title(title)
        .inner_size(1280.0, 820.0)
        .min_inner_size(720.0, 480.0)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![write_file, join_path, open_aux])
        .run(tauri::generate_context!())
        .expect("error while running Sisyphus");
}
