const TelegramAPI = require('node-telegram-bot-api')
const {add:add, findById,deleteById, updateById}=require('./Database/Repo')
let { addedButton, startKeyboard, createDayKeyboard, backToCreate, backToMenu } = require('./Helpers/InlineKeyboards');const token = "6993703742:AAGZLadrxQNeCqF_ZURg5O9Cl-CcClgTv6k"

const {safeEditMessageText,addText,show} = require('./Helpers/Functions');

const bot = new TelegramAPI(token,{polling: true})

const daysName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const userStatus={}

bot.setMyCommands([
    {command:'/start',description:"Start bot"},
    {command:'/show',description:"show schedule"},
    {command:'/help',description:"Info"}
])

let day=-1;

bot.on("message", async message => {
    let text = message.text;
    let chatId = message.chat.id;

    if (text === '/start') {
        userStatus[chatId]="start"
        return bot.sendMessage(chatId, 'Привет ' + message.chat.first_name, startKeyboard)
    }

    else if (text === '/help') {
        return bot.sendMessage(chatId, '/start - start bot\n/help - info about bot')
    }

    else if (text==='/message'){
        return bot.sendMessage(chatId,JSON.stringify(message,null,4))
    }
})


bot.on("callback_query", async query => {
    try {
        console.log(query.data);
        let chatId = query.message.chat.id;
        let messageId = query.message.message_id;

        if (query.data === "Show") {
            await show(bot,chatId, messageId)
        }

        if (query.data === "Drop") {
            for (let i = 0; i < 6; i++) {
                await deleteById(chatId, i);
            }
            await safeEditMessageText(bot,"Расписание удалено",chatId,messageId, backToMenu.reply_markup)
        }

        if (query.data === "backToMenu") {
            await safeEditMessageText(bot,'Привет ' + query.message.chat.first_name, chatId,messageId,startKeyboard.reply_markup)
        }

        if (query.data === "Create" || query.data === "backToCreate") {
            const text = "Выбери день и заполни :";
            await safeEditMessageText(bot,text, chatId, messageId, (await createDayKeyboard(chatId)).reply_markup)
        }


        if (daysName.includes(query.data)) {
            day = daysName.indexOf(query.data)
            await addText(bot,chatId, messageId,userStatus);
        }
    }catch (error){
        console.log(error);
    }
})


bot.on('message', async message => {
    const chatId = message.chat.id;
    let lessons=message.text.split(" ");

    console.log(userStatus)

    let text=""
    let count=1;
    for (let element of lessons) {
        text+=`${count}.${element}\n`;
        count++;
    }

    if (userStatus[chatId]==="add") {
        userStatus[chatId] = "start";

        const checkDay=await findById(chatId, day);
        if (checkDay.length === 0 ) {
            await add(chatId, lessons, day)
        }
        else {
            await updateById(chatId,day,lessons)
        }
        day=-1
        text+="Все добавлено!"
        return bot.sendMessage(chatId,text , addedButton);
    }
})




