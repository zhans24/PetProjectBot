const TelegramAPI = require('node-telegram-bot-api')
const {add:add, findById,deleteById, updateById}=require('./Database/RepoDays')
const { addedButton, startKeyboard, createDayKeyboard, timeKeyboard, scheduleKeyboard, backToCreate, backToMenu, empty} = require('./Helpers/InlineKeyboards');
const token = "6993703742:AAGZLadrxQNeCqF_ZURg5O9Cl-CcClgTv6k"
const {safeEditMessageText,addText,show} = require('./Helpers/Functions');
const cron = require("node-cron");

const {addTime,deleteTime,findTime,updateTime}=require('./Database/RepoTime')

const bot = new TelegramAPI(token,{polling: true})

const daysName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const times=['18:00','21:00','00:00']

const userStatus={}
const userDayToAdd={}

bot.setMyCommands([
    {command:'/start',description:"Start bot"},
    {command:'/help',description:"Info"}
])

bot.on("message", async message => {
    let text = message.text;
    let chatId = message.chat.id;

    if (text === '/start') {
        userStatus[chatId]="start"
        userDayToAdd[chatId]=-1
        return bot.sendMessage(chatId, `Привет ${message.chat.first_name} 👋`, startKeyboard)
    }

    else if (text === '/help') {
        return bot.sendMessage(chatId, '/start - запуск бота\n\nЕсли есть другие вопросы напишите : @gazizhasik')
    }
    else if (text==='/message'){
        return bot.sendMessage(chatId,JSON.stringify(message,null,4))
    }
})


bot.on("callback_query", async query => {
    try {
        let text;
        let chatId = query.message.chat.id;
        let messageId = query.message.message_id;

        if (query.data === "Show") {
            await show(bot,chatId, messageId)
        }

        if (query.data === "Drop") {
            for (let i = 0; i < 6; i++) {
                await deleteById(chatId, i);
            }
            await safeEditMessageText(bot,"Расписание удалено",chatId,messageId, backToCreate.reply_markup)
        }

        if (query.data === "backToMenu") {
            await safeEditMessageText(bot,`Привет ${query.message.chat.first_name} 👋`, chatId,messageId,startKeyboard.reply_markup)
        }

        if (query.data === "Create" || query.data === "backToCreate") {
            text = "Выбери день и заполни :";
            await safeEditMessageText(bot,text, chatId, messageId, (await createDayKeyboard(chatId)).reply_markup)
        }


        if (daysName.includes(query.data)) {
            userDayToAdd[chatId] = daysName.indexOf(query.data)
            await addText(bot,chatId, messageId,userStatus);
        }

        if (query.data === "Settings"){
            text="Выбери время для получения уведомления:"
            await safeEditMessageText(bot,text,chatId,messageId,timeKeyboard.reply_markup)
        }

        if (query.data==="Schedule" || query.data==="backToSchedule"){
            text="Выбери действие:"
            await safeEditMessageText(bot,text,chatId,messageId,scheduleKeyboard.reply_markup);
        }

        if (query.data==="otherTime"){
            userStatus[chatId]="time"
            text="Напишите время в которое бот будет отправлять завтрашнее расписание\n<i>Вот так: <u>21:00</u></i>"
            await safeEditMessageText(bot,text,chatId,messageId);
            setTimeout(()=>{
                bot.deleteMessage(chatId,messageId)
            },10_000)
        }

        if (times.includes(query.data)){
            await addTime(chatId,query.data);
            await safeEditMessageText(bot,"Время установлено✅", chatId,messageId,backToMenu.reply_markup)
        }
    }catch (error){
        console.log(error);
    }
})


bot.on('message', async message => {
    const chatId = message.chat.id;
    const messageId=message.message_id;


    if (userStatus[chatId]==="time"){
        userStatus[chatId]="start";
        await addTime(chatId, message.text)
        await bot.sendMessage(chatId,"Время установлено✅",backToMenu)
        setTimeout(()=>{
            bot.deleteMessage(chatId,messageId)
        },2_000)
    }

    if (userStatus[chatId]==="add") {
        let lessons=message.text.split(" ");

        let text=""
        let count=1;
        for (let element of lessons) {
            text+=`${count}.${element}\n`;
            count++;
        }

        userStatus[chatId] = "start";

        const checkDay=await findById(chatId, userDayToAdd[chatId]);
        if (checkDay.length === 0 ) {
            try {
                await add(chatId, lessons, userDayToAdd[chatId])
            }catch (error){
                return bot.sendMessage(chatId,"Ошибка в добавлении к БД")
            }
        }
        else {
            try {
                await updateById(chatId,userDayToAdd[chatId],lessons);
            }catch (error){
                return bot.sendMessage(chatId,"Ошибка обновления в БД")
            }

        }
        userDayToAdd[chatId]=-1
        text+="\n<b>Все добавлено 😉</b>"
        return bot.sendMessage(chatId,text , {
            parse_mode:"HTML",
            reply_markup:addedButton.reply_markup
        });
    }
})



cron.schedule('* * * * *',async () => {
    let minutes=String(new Date().getMinutes()).padStart(2,'0');
    let hours=String(new Date().getHours()).padStart(2,'0');
    let tomorrow = new Date().getDay() + 1;

    let currTime=`${hours}:${minutes}`;
    const daysOfWeek = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

    let users=await findTime(currTime)
    if (users.length>0) {
        users.forEach(user => {
            let chatId = Number(user._id)
            if (tomorrow !== 7) {
                let text = ""
                for (const lessons of (findById(chatId, tomorrow - 1))) {
                    text += `${lessons}\n`
                }

                bot.sendMessage(chatId, `Завтра <i>${daysOfWeek[tomorrow]}</i>:\n${(text.length === 0) ? "<B>Не заполнено</B>" : text}`,
                    {
                        parse_mode: "HTML"
                    })
            } else {
                bot.sendMessage(chatId, "Завтра <b>воскресенье</b> отдыхай!🔥", {
                    parse_mode: "HTML"
                });
            }
        })
    }
})