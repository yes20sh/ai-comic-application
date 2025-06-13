document.getElementById('generate-btn').addEventListener('click', async () => {
  const prompt = document.getElementById('prompt').value.trim();
  const genre = document.getElementById('genre').value;
  const panels = parseInt(document.getElementById('panels').value);
  const artStyle = document.getElementById('art-style').value;
  const tone = document.getElementById('tone').value;
  const wordLength = document.getElementById('word-length').value;
  const toneEnding = document.getElementById('tone-ending').value;

  const loadingSpinner = document.getElementById('loading-spinner');
  const comicContainer = document.getElementById('comic-container');
  const comicPanels = document.getElementById('comic-panels');
  const comicTitle = document.getElementById('comic-title');
  const comicDescription = document.getElementById('comic-description');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  // Reset
  comicContainer.classList.add('hidden');
  errorMessage.classList.add('hidden');
  comicPanels.innerHTML = '';
  loadingSpinner.classList.remove('hidden');

  if (!prompt) {
    alert('Please enter a prompt!');
    loadingSpinner.classList.add('hidden');
    return;
  }

  const API_KEY = 'AIzaSyAB_dhliD7qqi3fWFuPjyJWTrDGLVocwCk'; // ⚠️ Replace with environment-safe variable in production
  const model = 'gemini-2.0-flash-preview-image-generation';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const systemPrompt = `
You are a creative comic artist AI. Based on the user's idea and input, generate a short comic storyline and base64 PNG image for each panel.

Output format:
TITLE: <Comic Title>
DESCRIPTION: <Short Summary>
PANELS:
1. <Caption or dialogue for panel 1>
2. <Caption or dialogue for panel 2>
...
Each panel must have a matching base64 image (PNG format).
`;

  const userPrompt = `
Comic idea: ${prompt}
Genre: ${genre}
Tone: ${tone}
Ending Tone: ${toneEnding}
Art Style: ${artStyle}
Number of Panels: ${panels}
Preferred Word Length per panel: ${wordLength}
Please generate the comic storyline and base64 PNG images.
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n${userPrompt}` }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    });

    const data = await response.json();
    console.log(data);

    let parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content in response");

    let title = '';
    let description = '';
    let captions = [];
    let images = [];

    for (const part of parts) {
      if (part.text) {
        const lines = part.text.split('\n');
        for (const line of lines) {
          if (line.startsWith('TITLE:')) title = line.replace('TITLE:', '').trim();
          else if (line.startsWith('DESCRIPTION:')) description = line.replace('DESCRIPTION:', '').trim();
          else if (/^\d+\.\s/.test(line)) captions.push(line.replace(/^\d+\.\s/, '').trim());
        }
      } else if (part.inlineData?.mimeType === 'image/png') {
        images.push(part.inlineData.data);
      }
    }

    if (images.length === 0 || captions.length === 0) throw new Error("Missing image or text content");

    comicTitle.textContent = title;
    comicDescription.textContent = description;

    for (let i = 0; i < Math.min(images.length, captions.length); i++) {
      const panel = document.createElement('div');
      panel.className = 'comic-panel rounded-lg border border-gray-200 p-4 shadow-sm bg-gray-50';

      const img = document.createElement('img');
      img.src = `data:image/png;base64,${images[i]}`;
      img.alt = `Comic Panel ${i + 1}`;
      img.className = 'w-full mb-2 rounded';

      const caption = document.createElement('p');
      caption.className = 'text-sm text-gray-700';
      caption.textContent = captions[i];

      panel.appendChild(img);
      panel.appendChild(caption);
      comicPanels.appendChild(panel);
    }

    comicContainer.classList.remove('hidden');

  } catch (error) {
    console.error(error);
    errorText.textContent = 'Something went wrong while generating the comic.';
    errorMessage.classList.remove('hidden');
  } finally {
    loadingSpinner.classList.add('hidden');
  }
});

// Optional: Enable Download Button Functionality
// document.getElementById('download-btn').addEventListener('click', async () => {
//   const node = document.getElementById('comic-container');
//   const comicTitle = document.getElementById('comic-title')?.textContent?.trim() || 'comic';

//   if (!node) {
//     alert('No comic to download. Please generate a comic first.');
//     return;
//   }

//   try {
//     // Clone the node to avoid modifying the original
//     const clone = node.cloneNode(true);
//     clone.style.width = node.offsetWidth + 'px';
//     clone.style.backgroundColor = 'white';
//     document.body.appendChild(clone);
//     clone.style.visibility = 'hidden';
    
//     const dataUrl = await htmlToImage.toPng(clone, {
//       quality: 1,
//       pixelRatio: 2,
//       backgroundColor: 'white'
//     });

//     document.body.removeChild(clone);
    
//     const link = document.createElement('a');
//     link.download = `${comicTitle.replace(/\s+/g, '_')}.png`;
//     link.href = dataUrl;
//     link.click();
    
//   } catch (err) {
//     console.error('Download failed:', err);
//     alert('Failed to download comic. Please try again.');
//   }
// });