# LLM-Translated Subtitle Validator

This repository contains a simple, browser-based tool to validate and compare SRT subtitle files. It was specifically created to help identify and correct common errors found in subtitles translated by Large Language Models (LLMs).

## Motivation

My mom loves to watch movies and TV shows, but she isn't fluent in English. Properly translated subtitles are the perfect way for her to enjoy and understand the content. While Large Language Models (LLMs) are incredibly powerful and can translate subtitles in seconds, they often introduce subtle errors, such as desynchronized timestamps or the use of incorrect characters from a different language's script.

I created this tool to serve as a final quality-check, making it easy to catch these specific LLM-generated mistakes and ensure the subtitles are perfect for her.

## How LLMs Can Fall Short

LLMs are great for translation, but they can sometimes struggle with the strict formatting of `.srt` files or the nuances of different scripts. Common issues include:

* **Timestamp Drift:** The model may slightly alter timestamps, causing subtitles to appear too early or too late.
* **Character "Hallucinations":** When translating for a specific language (like Telugu), the model might mistakenly insert characters from a similar-looking but incorrect script (like Devanagari or Kannada).
* **Formatting Errors:** Line breaks or subtitle numbering can sometimes be corrupted.

This validator is designed to programmatically catch these exact issues.

## Original Prompt

This tool was inspired by the need to create high-quality, casual Telugu subtitles. The original prompt that started this project was:

> "Given this prompt 'Please translate the subtitles for the TV show Psych (2006), S01E05, '9 Lives.' I would like them to be translated into casual Telugu so that my mother can better understand.
> 
> You don't have to translate all words into Telugu if they are better left in English. For example, proper names like 'Shawn Spencer' and basic phrases like 'At the top!' can remain in English. However, my mom will not understand complex English words, such as 'dimwitted,' so please translate those.
> 
> Essentially, I am asking you to incorporate 'Tenglish,' ensuring that Telugu words are in the Telugu script and English words remain in English text. Therefore, do not transliterate Telugu words into English letters.' translate the srt file. The translated text must strictly contain only English words (using the Latin alphabet) and Telugu words (using the Telugu script). Explicitly forbid the use of characters from any other scripts like Kannada, Tamil, Hindi, or Devanagari. Words from other languages (e.g., Spanish, Korean, Malayalam, Bengali) should not be used unless they exist in the input srt file. Ensure the timestamps are an exact copy."

## Features

The `SRT Subtitle Validator.html` tool helps ensure the translated file meets strict requirements by performing two main checks:

1. **Timestamp Synchronization:** It compares the timestamps of the original English SRT file against the translated file to ensure they are perfectly aligned. It reports any mismatches, showing the expected and actual timestamps.

2. **Character Validation:** It scans the translated SRT file to ensure it only contains characters from an allowed set of scripts. By default, it's configured for English and Telugu, flagging any "foreign" characters so you can quickly find and correct them.

## How to Use

1. Download or clone this repository.
2. Open the `SRT Subtitle Validator.html` file in any modern web browser.
3. Upload your original English `.srt` file as the reference.
4. Upload the LLM-translated `.srt` file.
5. Click the "Validate Files" button to see a detailed report of any timestamp or character mismatches.

## Adapting for Other Languages

This tool can be easily modified to validate subtitles for any language. You just need to change one line of code in the `SRT Subtitle Validator.html` file.

1. Open the HTML file in a text editor.
2. Find the `checkLanguageScript` function in the `<script>` section.
3. Locate this line: `const isTelugu = (code) => code >= 0x0C00 && code <= 0x0C7F;`
4. Replace it with a check for your target language's Unicode range. For example, to validate for **Tamil**, you would change it to:

```javascript
const isTamil = (code) => code >= 0x0B80 && code <= 0x0BFF;
```

5. Finally, update the `if` condition inside the loop to use your new function:

```javascript
// Before
if (!(isBasicLatin(code) || isLatinSupplement(code) || isTelugu(code) || ...)) {

// After (for Tamil)
if (!(isBasicLatin(code) || isLatinSupplement(code) || isTamil(code) || ...)) {
```

You can find the correct Unicode block for any language online (e.g., by searching "Tamil unicode range").