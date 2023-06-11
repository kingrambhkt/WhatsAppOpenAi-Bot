// Import required modules
require("dotenv").config();
const {
  BufferJSON,
  WA_DEFAULT_EPHEMERAL,
  generateWAMessageFromContent,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  getContentType,
} = require("@adiwajshing/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const { Configuration, OpenAIApi } = require("openai");

// Load custom prompt from file
const customPrompt = fs.readFileSync("custom_prompt.txt", "utf-8");

// Load chat history from file
const chatHistory = readChatHistoryFromFile();

// Utility function to read chat history from file
function readChatHistoryFromFile() {
  try {
    const data = fs.readFileSync("chat_history.json", "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Utility function to write chat history to file
function writeChatHistoryToFile(chatHistory) {
  fs.writeFileSync("chat_history.json", JSON.stringify(chatHistory));
}

// Utility function to update chat history
function updateChatHistory(sender, message) {
  // If this is the first message from the sender, create a new array for the sender
  if (!chatHistory[sender]) {
    chatHistory[sender] = [];
  }
  // Add the message to the sender's chat history
  chatHistory[sender].push(message);
  // If the chat history exceeds the maximum length of 20 messages, remove the oldest message
  if (chatHistory[sender].length > 20) {
    chatHistory[sender].shift();
  }
}

// Export function that handles incoming messages
module.exports = goutam = async (client, m, chatUpdate, store) => {
  try {
    // If the sender has no chat history, create a new array for the sender
    if (!chatHistory[m.sender]) chatHistory[m.sender] = [];

    // Get the content of the incoming message
    const text = m.text;
    const isCmd2 = text.startsWith("!");
    const command = text.trim().split(/ +/).shift().toLowerCase();
    const args = text.trim().split(/ +/).slice(1);

    // If the message is an OpenAI command, do nothing and return
    if (command === "ai" || command === "openai") {
      // do nothing, this is to ignore the 'ai' and 'openai' commands
    }
    // If the message is a command, handle the command
    else if (isCmd2) {
      switch (command) {
        case "menu":
          m.reply(`*Hello ${pushname !== undefined ? pushname : '-'}*
         
╭–– *『 USER INFO 』*
┆
┆ • Name : *${pushname !== undefined ? pushname : '-'}*
┆ • Status : *Free*
┆ • Limit : *undefined*
┆ • Role : *User*
┆
╰–––––––––––––––༓

╭–– *『 WHATSAPP OPENAI BOT 』*
┆ 
┆ *ChatGPT*
┆ • ${prefix}ai
┆ Ask any questions to OpenAi
┆
┆ *Dall-E*
┆ • ${prefix}img
┆ Generate a image from text
┆
┆ *Script Bot*
┆ • ${prefix}sc
┆ Source code of OpenAi WhatsApp Bot
┆
╰–––––––––––––––༓`);
          // add test command functionality here
          break;
        default:
          // add default case here
          break;
      }
    }
    // If the message is not a command, use OpenAI to generate a response
    else {
      // If OpenAI API key is not configured, return and do nothing
      if (!process.env.OPENAI_API_KEY) return;
      // Create OpenAI API client
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      // Create chat completion request using previous messages from chat history
      const messages = [
        { role: "system", content: customPrompt },
        ...(chatHistory[m.sender]?.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })) || []),
        { role: "user", content: text },
      ];

      // Use OpenAI to generate response based on chat history and incoming message
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      // Update chat history with incoming message and OpenAI-generated response
      updateChatHistory(m.sender, { role: "user", content: text });
      updateChatHistory(m.sender, {
        role: "assistant",
        content: response.data.choices[0].message.content,
      });

      // Reply to the incoming message with OpenAI-generated response
      m.reply(`${response.data.choices[0].message.content}`);
    }
  } catch (err) {
    // If an error occurs, reply to the incoming message with the error message
    m.reply("*⚠️ An error corrupted!*");
  }
};

// Watch for changes in this file and reload the code if changes are detected
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
