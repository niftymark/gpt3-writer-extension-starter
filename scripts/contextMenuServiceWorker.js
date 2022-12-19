const generateCompletionAction = async (info) => {
  try {
    // Send mesage with generating text (this will be like a loading indicator)
    sendMessage("generating...");
    const { selectionText } = info;
    const basePromptPrefix = `
List 5 ideas of gifts that a person would love to receive for Christmas based on the activities and items they like. Please make sure to consider all the activities and items the person likes and shows in-depth research in all topics and add one crazy idea as well.

Activities and items they like:
`;

    const baseCompletion = await generate(
      `${basePromptPrefix}${selectionText}`
    );
    const secondPrompt = `
    Take the following list of gift ideas and add some aspects to them how they could be personalized to that person's interest and likes. Explain why.
  
    Activities and items the person likes: ${selectionText}
  
    List of gift ideas: ${baseCompletion.text}
  
    Personalized gift ideas:
    `;
    const secondPromptCompletion = await generate(secondPrompt);
    console.log(secondPromptCompletion.text);
    sendMessage(secondPromptCompletion.text);
  } catch (error) {
    console.log(error);
    sendMessage(error.toString());
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "context-run",
    title: "Generate Gift ideas",
    contexts: ["selection"],
  });
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);

// Function to get + decode API key
const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["openai-key"], (result) => {
      if (result["openai-key"]) {
        const decodedKey = atob(result["openai-key"]);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: "inject", content },
      (response) => {
        if (response.status === "failed") {
          console.log("injection failed.");
        }
      }
    );
  });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = "https://api.openai.com/v1/completions";

  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 600,
      temperature: 0.8,
    }),
  });

  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
};
