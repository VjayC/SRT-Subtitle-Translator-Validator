#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::Mutex;
use tauri::{Manager, RunEvent};
use tauri_plugin_dialog::DialogExt; // <--- Imports the native dialog tools for Rust

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            
            // 1. Check if Java is installed BEFORE trying to start the backend
            if Command::new("java").arg("-version").output().is_err() {
                // Java is missing! Show a native OS error popup.
                app.dialog()
                    .message("Java Runtime Environment (JRE) was not found on your system.\n\nThis application requires Java 17 or higher to run its local validation engine.\n\nPlease download and install Java from adoptium.net and restart the application.")
                    .title("Missing Dependency: Java")
                    .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                    .blocking_show();
                
                // Close the app gracefully instead of crashing
                std::process::exit(1);
            }

            // 2. Dynamically resolve the absolute path to the bundled JAR file
            let resource_path = app.path()
                .resolve("binaries/backend-0.0.1-SNAPSHOT.jar", tauri::path::BaseDirectory::Resource)
                .expect("Failed to find bundled backend-0.0.1-SNAPSHOT.jar");

            // 3. Spawn the Java process safely
            let backend_process = Command::new("java")
                .args(["-jar", resource_path.to_str().unwrap()])
                .spawn()
                .expect("Failed to start Spring Boot backend.");

            // 4. Save the process handle safely in Tauri's state manager
            app.manage(Mutex::new(backend_process));

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            // 5. Listen for the app closing
            if let RunEvent::Exit = event {
                println!("Application is exiting. Sending graceful shutdown to backend...");
                
                // Politely ask Spring Boot to shut down the proxy
                let _ = Command::new("curl")
                    .args(["-X", "POST", "http://localhost:8080/api/proxy/shutdown"])
                    .output();

                // Retrieve the Java process handle from state and force kill it as a failsafe
                if let Some(process_mutex) = app_handle.try_state::<Mutex<std::process::Child>>() {
                    if let Ok(mut process) = process_mutex.lock() {
                        let _ = process.kill();
                    }
                }
            }
        });
}