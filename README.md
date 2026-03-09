# SRT Translator & Validator

<p align="center">
  <img src="./images/icon.svg" width="128" height="128" alt="SRT Translator & Validator Icon">
</p>

<p align="center">
<a href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator/blob/main/LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/License-MIT-28a745" style="max-width: 100%;"></a>
<a href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/VjayC/SRT-Subtitle-Translator-Validator?label=Release" style="max-width: 100%;"></a>
<a href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator"><img alt="Star this repo" src="https://img.shields.io/github/stars/VjayC/SRT-Subtitle-Translator-Validator.svg?style=social&amp;label=Star%20this%20repo&amp;maxAge=60" style="max-width: 100%;"></a>
</p>

A comprehensive browser-based and desktop tool that leverages Large Language Models (LLMs) to translate SRT subtitle files and automatically validate the output for common errors. Built specifically to create high-quality, script-accurate subtitles using your existing LLM subscriptions (Gemini, Claude, OpenAI, etc.) via [CLI Proxy API](https://github.com/router-for-me/CLIProxyAPI).

Original TV Show in English            |  Output of translated SRT in Tenglish
:-------------------------:|:-------------------------:
![](./images/psych_english_translation.png)  |  ![](./images/psych_tenglish_translation.png)

> [!NOTE]
> Screenshots are taken from *Psych*, an American detective comedy-drama television series created by Steve Franks for USA Network.

## Motivation

My mom loves to watch movies and TV shows, but she isn't fluent in English. Properly translated subtitles are the perfect way for her to enjoy and understand the content. While Large Language Models (LLMs) are incredibly powerful and can translate subtitles in minutes, they often introduce subtle errors, such as:

* **Timestamp Drift:** The model may slightly alter timestamps, causing subtitles to appear too early or too late.
* **Character "Hallucinations":** When translating for a specific language (like Telugu), the model might mistakenly insert characters from a similar-looking but incorrect script (like Devanagari, Tamil, or Kannada).
* **Incomplete Translations:** Long subtitle files may be cut off mid-translation.
* **Formatting Errors:** Line breaks or subtitle numbering can sometimes be corrupted.

This tool automates the entire translation workflow, validates the output, and provides one-click fixes for common LLM errors—ensuring the subtitles are perfect.

## What This Tool Replaces

This is the successor to my original SRT Subtitle Validator, which could only validate pre-translated files. The new **SRT Translator & Validator** combines translation and validation into a single, streamlined workflow with automatic error correction.

## Features

### Translation Modes
- **Translate:** Ideal for translating an entire file at once. Recommended for SRT files with around 800 to 900 indexes.
- **Batch Translate:** Translates the file in manageable batches, preventing context-length cutoffs. Recommended for files with over 900 indexes.
- **Standalone Validate:** Dedicated mode to validate and fix an already translated SRT file without re-translating.

### Translation Capabilities
- **Direct LLM Integration:** Translate subtitles using any supported LLM via CLI Proxy API.
- **Customizable Prompts:** Full markdown editor with live preview for translation instructions.
- **Partial Translation Recovery:** Automatically detects incomplete translations and continues from where it stopped.
- **Language Detection:** Automatically identifies the target language for proper filename generation.
- **Raw Output Logging:** Saves all LLM responses with timestamps for debugging.

### Validation
- **Timestamp Synchronization:** Compares timestamps between source and translated files, reporting any mismatches with detailed ranges
- **Script Validation:** Ensures translated text only contains characters from allowed Unicode ranges (e.g., English + Telugu)
- **Configurable Character Sets:** Search from 130+ language scripts or add custom Unicode ranges/characters
- **Real-time Feedback:** Color-coded error reports with subtitle indices and Unicode values

### Automatic Error Correction
- **Fix Timestamp Errors:** One-click replacement of incorrect timestamps with source values
- **Fix Script Errors:** Sends problematic subtitles back to Gemini for automatic correction
- **Combined Fixing:** Handles both timestamp and script errors in a single operation
- **Smart Validation:** Re-checks after fixes and shows remaining issues

### User Experience
- **Editable Output:** View and manually edit translated subtitles before downloading
- **Auto-save:** Preserve manual edits while continuing the workflow
- **Progress Tracking:** Browser tab title shows current status (Translating, Translated, Fixing, Fixed, Error)
- **Auto-scroll:** Automatically scrolls to validation results
- **Dark/Light Mode:** Adapts to your system theme preference
- **Configured Prompt Templates:** Loads your saved configuration and prompt to minimize manual entry
- **File Drag & Drop:** Supports an alternative way to upload files

## Desktop Application Specifics

You can download the latest native installer for your operating system (Mac, Windows, or Linux) from the **[GitHub Releases page](https://github.com/VjayC/SRT-Subtitle-Translator-Validator/releases)**.

If you are using the downloadable native desktop application, it comes with several built-in enhancements:

- **Automated Proxy Management:** The application will automatically launch and stop the CLI Proxy API for you! You must navigate to **Global Settings** and save the appropriate launch command for your Operating System (Windows, macOS, or Linux).
- **Manual Updates Required:** While the desktop app can auto-update itself via the Settings page, **you must keep the underlying CLI Proxy API up to date manually**, just as you did for the web version. The dashboard provides a convenient status indicator and links to the latest GitHub and Homebrew releases.
- **Strict Template Enforcement:** The desktop application's Template Manager **only accepts `@Config` configured templates**. Raw text templates are not supported in the desktop app to ensure a strict and automated workflow.
- **Embedded Database:** Your settings and validated templates are saved locally via an embedded H2 database and persist between sessions.

## Prerequisites

### Desktop Application Requirements
If you are downloading the native `.dmg`, `.exe`, or `.AppImage` files, please ensure your system meets the following requirements:

* **Java Runtime Environment (JRE):** The desktop application bundles a local Spring Boot server for its validation engine. You **must** have Java 17 or higher installed and available in your system's PATH. You can download it from [Adoptium (Eclipse Temurin)](https://adoptium.net/).
* **Windows:** Requires the Microsoft Edge WebView2 Runtime (this is already pre-installed on Windows 11 and fully updated Windows 10 machines).
* **macOS:** Because this application is not signed with a paid Apple Developer certificate, macOS Gatekeeper will block it initially. To safely bypass this for your first launch:
  1. Try to open the app normally from your Applications folder (it will show a blocked warning).
  2. Open your Mac's **System Settings** (Apple menu  > System Settings).
  3. Click **Privacy & Security** in the left sidebar and scroll down to the **Security** section.
  4. You will see a message saying the app was blocked. Click the **Open Anyway** button. *(Note: This button is only available for about an hour after you try to open the app).*
  5. Enter your Mac login password and click **Open**.
  *(You only have to do this once! It will open normally every time after).*
* **Linux:** Requires WebKit2GTK to render the application window. If it doesn't launch, you may need to install it via your package manager (e.g., `sudo apt install libwebkit2gtk-4.1-0`).

### CLI Proxy API Installation

CLI Proxy API is required to access your Gemini subscription through an API interface.

For installation instructions, please visit: https://help.router-for.me/introduction/quick-start.html

### LLM Authentication

Depending on which model you want to use (Gemini, Claude, OpenAI, etc.), you will need to authenticate the CLI Proxy API. 

For step-by-step instructions on authenticating different models, please go to the [CLI Proxy API Provider Configuration](https://help.router-for.me/configuration/provider/gemini-cli.html) and click on the respective model name in the sidebar to view the correct commands.

**Example for Gemini:**
1. Run the login command:
`cliproxyapi --login`

If you're an existing Gemini Code user:
`cliproxyapi --login --project_id <your_project_id>`

2. Follow the OAuth flow in your browser to authenticate
3. The local OAuth callback uses port `8085`

### Configuration

Create or edit your `config.yaml` file.

For more information, please visit: https://help.router-for.me/configuration/basic.html or use the provided example `config.yaml`.

> [!IMPORTANT]
> The `api-keys` value in `config.yaml` must match the API Key field in the web application. The key `dummy` is used by default if the field is left blank.

## Usage

### 1. Start CLI Proxy API Server

If installed via Homebrew:
```bash
/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config ~/path/to/your/config.yaml
```

If built from source:
```bash
./cli-proxy-api --config /path/to/your/config.yaml
```

The server will start on `http://localhost:8317` by default.

### 2. Open the Web Application

Open this link [`SRT Translator & Validator`](https://vjayc.github.io/SRT-Subtitle-Translator-Validator/) in any modern web browser.

### 3. Configure the Application

1. **CLI Proxy API Endpoint:** Default is `http://localhost:8317/v1/chat/completions`
2. **Model Name:** Default is `gemini-2.5-pro`
3. **API Key:** Enter the same key from your `config.yaml` (e.g., `1234567`)

### 4. Set Up Allowed Scripts

By default, the tool allows:
- Basic Latin (English alphabet)
- Latin Supplement (é, ñ, etc.)
- Special characters (quotes, em-dash, line breaks)

To add your target language:
1. Type the language name in the search bar (e.g., "Telugu", "Arabic", "Tamil")
2. Click the suggested script to add it
3. Or add custom Unicode ranges: `U+0C00-U+0C7F` or single characters: `U+0C00`

You can also remove any script (except special characters and line breaks) by clicking the × button.

### 5. Create Your Translation Prompt
> [!CAUTION]
> Update your translation prompts to remove any mention of timestamps, as the model no longer sees or generates them.

Write your translation instructions in the prompt field. You can use markdown formatting and switch to **Markdown View** to preview how it renders.

#### Using Configured Prompt Templates

For reusable prompts with dynamic values, create a template file with optional configuration:

1. Create a `.txt` file with placeholders using `{{Variable Name}}` syntax
2. Click **"📥 Import Template"** or drag and drop the template file onto the prompt section
3. Fill in the template variables that appear
4. Click **"Apply Template"** to generate your final prompt

**Basic Template Example:**
```markdown
You are translating subtitles for {{Show Name}}, Season {{Season}}, Episode {{Episode}}.

Translate from {{Source Language}} to {{Target Language}}.

**Style Guidelines:**
- Use {{Formality Level}} language
- Keep character names in {{Name Language}}

[Rest of your translation instructions...]
```

When imported, you'll be prompted to fill in: Show Name, Season, Episode, Source Language, Target Language, Formality Level, and Name Language.

**Configured Template Example (Advanced):**

For even more automation, add a `@Config` header to pre-configure settings:
```markdown
@Config
{{http://localhost:8317/v1/chat/completions}}
{{gemini-3-flash-preview}} {{gemini-3.1-pro-preview}}
{{Basic Latin}} {{Latin Supplement}} {{Telugu}}
{{TV show}} {{Psych}} {{2006}} {{, S01E01}} {{, (Title)}}

You are translating subtitles for the {{Enter movie or TV show}} {{Movie/TV Show Name}} ({{Release Year}}){{Season/Episode Number}}{{Episode Title}}.

[Rest of your translation instructions...]
```

**Configuration Format:**
- **Line 1:** `@Config` marker
- **Line 2:** API endpoint URL
- **Line 3:** Two model Names for Language Detection and Translation
- **Line 4:** Allowed script ranges (language scripts or Unicode ranges)
- **Line 5:** Default values for placeholders in the prompt body (must match the order and number of unique placeholders)
- **Line 6:** Empty line (required separator)
- **Lines 7+:** Your prompt template with `{{placeholders}}`

When a configured template is imported:
- API endpoint, model, and script ranges are automatically applied
- Template inputs are pre-filled with the default values
- You can still modify any values before applying

> [!TIP]
> See `Example Config Prompt Template.txt` for a complete configured template example.

**Example Non-Template Prompt:**
```markdown
You are a hyper-vigilant subtitle translator and formatter. Your task is to translate an English .srt file into casual "Tenglish" (a mix of Telugu and English). Your primary directive is 100% accuracy in CONTENT MAPPING and SCRIPT & LANGUAGE RULES mentioned below. Failure to adhere to these rules is not an option.

**Goal:** Translate the attached English .srt file for the TV show Psych (2006), S02E02, (65 Million Years Off) into casual Telugu for a native Telugu speaker who is not fluent in English.

### Core Directives (Must be followed without exception):

**PERFECT LINE BREAKS:** Preserve the original line breaks within each subtitle entry. If the original English subtitle has two lines, the translated Tenglish subtitle must also have two lines. Do not merge lines.

**STRICT 1:1 CONTENT MAPPING (NO MERGING OR SHIFTING):**
- **ONE SOURCE = ONE TARGET:** Content in Source ID `X` MUST appear *only* in Target ID `X`.
- **ISOLATE SHORT LINES (CRITICAL):** Short interjections (e.g., "Pardon me", "Hey", "No") in ID `X+1` act as hard barriers. **NEVER** merge them into the previous block (ID `X`). They must remain standalone to prevent index shifting.
- **NO "MERGING UP":** If ID `X` ends with `...` or an incomplete thought, leave it incomplete. **DO NOT** pull text from ID `X+1` to finish the sentence.
- **NO COMPRESSION:** If the source has 3 blocks, the output must have 3 blocks. Merging `X` and `X+1` causes `X+2` to shift incorrectly, destroying synchronization.
- **PRESERVE FRAGMENT ORDER (ANTI-SOV):** If "Action" is in ID `A` and "Reason" is in ID `B`, keep them separate. Do not move the "Reason" up to ID `A` to satisfy Telugu grammar.
- **TOLERATE FRAGMENTED GRAMMAR":** Telugu grammar usually places the verb at the end (SOV). However, subtitle timing (SVO) takes precedence.
    - If English Block `X` says "I went to...", the Telugu Block `X` **MUST** end with a connector or incomplete phrase (e.g., "నేను వెళ్ళాను...").
    - **DO NOT** move the destination from Block `X+1` into Block `X` just to close the sentence.
    - It is better to have "Broken Telugu" than "Broken Sync."

**SCRIPT & LANGUAGE RULES (CRITICAL):**
- **Definition of "Tenglish":** This is a Mixed-Script translation.
    - English Words: Keep common English words, names (Shawn Spencer), and simple phrases (Who's in there?) in English.
    - Telugu Words: Translate complex concepts and words (requisitioning) into casual Telugu.
- **NO ROMANIZATION:** Do not transliterate Telugu words into English letters. Use the Telugu script.
- **ALLOWED CHARACTERS:** The text may ONLY contain Standard English (Latin) characters and Telugu script characters. ABSOLUTELY NO characters from any other script are allowed. This includes, but is not limited to, Devanagari (Hindi: नी), Gujarati (હ), Japanese (気), Tamil (த), Kannada (ಚಿ), or Malayalam (മ).

### Error Correction Examples (Pay close attention to these):

This table shows the exact type of script errors to avoid and their correct replacements.

| Original English | ❌ Incorrect Translation (Mistake) | ✅ Correct Translation (Goal) |
|---|---|---|
| - I can't see a thing in here.<br>- I got it. | ఇక్కడ నాకు ఏమీ కనపడట్లేదు. నా దగ్గర ఉంది. (Merged lines) | - ఇక్కడ నాకు ఏమీ కనపడట్లేదు.<br>- నా దగ్గర ఉంది. (Correctly kept two lines) |
| a killer's window | ఒక હત్యకుడి window (Uses Gujarati હ) | ఒక హత్యకుడి window (Uses correct Telugu హ) |
| if you don't mind | మీరు気に పట్టించుకోకపోతే (Uses Japanese 気) | మీరు పట్టించుకోకపోతే (Uses correct Telugu script only) |
| I am not a suspect | నేను suspect नी కాదు (Uses Devanagari नी) | నేను suspect ని కాదు (Uses correct Telugu ని) |
| I am ready. | Nenu ready ga unnanu. (Romanized - BANNED) | నేను ready గా ఉన్నాను. (Doesn't transliterate) |
| 284<br>Sheriff Jackson mentioned we had | 284<br>ఈ రోజు town లో ఇద్దరు visitors<br>ఉన్నారని Sheriff Jackson చెప్పారు.<br>(Error: Merged 284 & 285 into index 284 to fix grammar) | Sheriff Jackson mention చేసారు మనకి<br>(Keeps sentence incomplete to match Source) |
| 285<br>a couple of visitors<br>in town today. | 285<br>Cinnamon festival cancel<br>అయిందని మీకు తెలుసు కదా.<br>(Error: Content pulled from next line...) | 285<br>కొంతమంది visitors<br>ఈ రోజు town లో ఉన్నారని.<br>(Keeps "hanging" fragment separate) |
| 286<br>You are aware the cinnamon<br>festival has been cancelled. | 286<br>Oh, అవును.<br>(Error: Merging subtitles causes cascading mismatch) | 286<br>Cinnamon festival cancel<br>అయిందని మీకు తెలుసు కదా.<br>(Restores correct content to ID 286) |

### Final Verification Protocol:

Before providing the final output, perform a self-correction check. Review your entire translated file one last time to confirm:

1. **Line Break Check:** Does the line count of every subtitle entry match the source exactly?
2. **Merge Check:** Confirm that no distinct lines or separate subtitle blocks have been merged; strict 1:1 mapping must be maintained.
3. **Script Check:** Have you scanned the entire text to ensure there are zero characters from any script other than English and Telugu? Verify common error characters like హ vs. હ.

Please begin the translation of the attached file, adhering strictly to these enhanced directives.
```

### 6. Upload and Translate

1. Click "Choose Input SRT file..." and select your English subtitle file
2. Click **"Translate with Gemini"**
3. The tool will:
   - Detect the target language
   - Send the file to Gemini for translation
   - Automatically validate the output
   - Show any errors found

> [!TIP]
> You can drag and drop files directly onto the Prompt Template and Subtitle file upload buttons.

### 7. Handle Partial Translations

If Gemini stops mid-translation, you'll see:
- "⚠️ Partial Translation Detected!"
- Progress: "Translated: 250 / 500 subtitles"
- A **"⏩ Continue Translating"** button

Click the button to automatically resume translation from where it stopped. This process repeats until the file is complete.

### 8. Review and Edit

- View the translated subtitles in the editable text area
- Make manual corrections if needed
- Click **"💾 Save Edits"** to preserve changes

### 9. Fix Errors Automatically

If validation found errors, click **"🔧 Fix All Errors"** to:
- Automatically correct timestamp mismatches
- Send script errors back to Gemini for correction
- Re-validate and show remaining issues

### 10. Download Your Files

- **"💾 Download Translated SRT"**: Downloads the corrected subtitle file
  - Filename format: `OriginalName(Language)(Model).srt`
  - Example: `Psych.S04E05.1080p.BluRay.Remux.eng(Tenglish)(Gemini 2.5 Pro).srt`
- **"📄 Download Raw Output"**: Downloads all Gemini responses with timestamps for debugging

## Supported Languages

The tool includes 130+ pre-configured language scripts:

- **Indian:** Telugu, Hindi, Tamil, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Odia, Sinhala
- **East Asian:** Chinese (6 CJK blocks), Japanese (Hiragana, Katakana), Korean (Hangul)
- **Southeast Asian:** Thai, Lao, Burmese, Khmer, Tagalog, Balinese, Sundanese, Javanese
- **Middle Eastern:** Arabic (5 variants), Hebrew, Persian, Urdu, Syriac
- **European:** Greek, Cyrillic (4 variants), Armenian, Georgian
- **African:** Ethiopic, Tifinagh, Coptic, Vai, Bamum
- **Historical:** Egyptian Hieroglyphs, Cuneiform, Phoenician, Linear B, Runic, Ogham
- **And many more...**

You can also add any custom Unicode range or character.

## Troubleshooting

### "Translation Error: Failed to fetch"
- Ensure CLI Proxy API is running: `ps aux | grep cliproxyapi`
- Check the endpoint URL matches: `http://localhost:8317/v1/chat/completions`
- Verify the port in `config.yaml` matches (default: 8317)

### "No subtitles were translated"
- Check your Gemini quota/limits
- Try using `gemini-2.5-flash` instead of `gemini-2.5-pro`
- Verify your prompt is clear and includes the SRT file content

### "API Error: 401 Unauthorized"
- Ensure the API Key in the web app matches `api-keys` in `config.yaml`
- Try re-logging in: `cliproxyapi --login`

### "API Error: 503 Service Unavailable"
- The Gemini service may be temporarily overloaded or down
- Wait a few minutes and try again
- Check Gemini's status at [status.cloud.google.com](https://status.cloud.google.com)
- If persistent, try switching to a different model (e.g., `gemini-2.5-flash`)
- Verify your CLI Proxy API connection: restart the server and check logs

### Script validation errors persist after fixing
- Some errors may require manual correction
- Check that you've added all necessary language scripts (e.g., Telugu)
- Review the raw output file for Gemini's explanation

### Partial translations don't complete
- Gemini may have hit token limits; try splitting the file manually
- Check the raw output file to see where Gemini stopped

## Advanced Configuration

### Using Different Models

Edit the Model Name field to use other models. Since CLI Proxy API supports OpenAI, Claude, and Gemini, you can input models like `gpt-5.2`, `claude-sonnet-4-6`, or `gemini-3.1-pro-preview`. Depending on the model selected, translation quality may vary:
- `gemini-3-flash-preview`: Faster, cheaper, good for simple translations
- `gemini-2.5-pro`: More accurate, better for complex translations
- `gemini-3.1-pro-preview`: Latest model, best quality and reasoning
- See the [CLI Proxy API documentation](https://help.router-for.me/introduction/what-is-cliproxyapi.html#supported-models) or the [model definitions source](https://github.com/router-for-me/CLIProxyAPI/blob/main/internal/registry/model_definitions_static_data.go) for all supported models (the source may be more up to date).

> [!WARNING]
> The application has only been tested with `gemini-3.1-pro-preview`/`gemini-2.5-pro` and only uses `gemini-3-flash-preview` to detect the target translation language for the purpose of naming the output SRT file.

### Custom Unicode Ranges

Add specific character ranges for edge cases:
- Emoji: `U+1F600-U+1F64F`
- Mathematical symbols: `2200-22FF`
- Box drawing: `2500-257F`
- Any single character: `U+20AC` (€ symbol)

## Contributing

Contributions are welcome! Some areas for improvement:
- Support for streaming responses (real-time translation preview)
- ...

> [!NOTE]
> The Gemini LLM was chosen as the default due to best performance on the MMMLU (Multilingual Q&A) and MRCR v2 (8-needle | Long context performance) benchmarks.

## Credits

- Built on top of [CLI Proxy API](https://github.com/router-for-me/CLIProxyAPI)
- Inspired by the need for accessible, quality subtitles for non-English speakers

## License

MIT License - see LICENSE file for details

---

Made with ❤️ for my mom and anyone else who wants to enjoy content in their native language.