function telegram (config) {
    const httpclient = require('./httpclient')({
        
    });
    async function sendMessage(chat_id, text) {
        return await httpclient.postJson({
            char_id,
            text,
            parse_mode: 'Markdown'
        });
    }

    return {
        sendMessage: sendMessage
    }
}

module.exports = telegram;