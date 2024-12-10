const TelegramAPI = require('node-telegram-bot-api')
const {add:add, findById,deleteById, updateById}=require('./Database/RepoDays')
const { addedButton, startKeyboard, createDayKeyboard, timeKeyboard, scheduleKeyboard, backToCreate, backToMenu, empty} = require('./Helpers/InlineKeyboards');
const token = "6993703742:AAGZLadrxQNeCqF_ZURg5O9Cl-CcClgTv6k"
const {safeEditMessageText,addText,show} = require('./Helpers/Functions');
const cron = require("node-cron");

const {addTime,deleteTime,findTime,updateTime, findByIdTime}=require('./Database/RepoTime')

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

        else if (query.data === "Drop") {
            for (let i = 0; i < 6; i++) {
                await deleteById(chatId, i);
            }
            await safeEditMessageText(bot,"Расписание удалено",chatId,messageId, backToCreate.reply_markup)
        }

        else if (query.data === "backToMenu") {
            await safeEditMessageText(bot,`Привет ${query.message.chat.first_name} 👋`, chatId,messageId,startKeyboard.reply_markup)
        }

        else if (query.data === "Create" || query.data === "backToCreate") {
            text = "Выбери день и заполни :";
            await safeEditMessageText(bot,text, chatId, messageId, (await createDayKeyboard(chatId)).reply_markup)
        }


        else if (daysName.includes(query.data)) {
            userDayToAdd[chatId] = daysName.indexOf(query.data)
            await addText(bot,chatId, messageId,userStatus);
        }

        else if (query.data === "Settings"){
            text="Выбери время для получения уведомления:"
            const checkUserTime = await findByIdTime(chatId);
            if (checkUserTime)
                text+=`\n<b>Установленное время :</b> ${checkUserTime}\n\n<i>Чтобы изменить выберите время😉</i>`
            await safeEditMessageText(bot,text,chatId,messageId,timeKeyboard.reply_markup)
        }

        else if (query.data==="Schedule" || query.data==="backToSchedule"){
            text="Выбери действие:"
            await safeEditMessageText(bot,text,chatId,messageId,scheduleKeyboard.reply_markup);
        }

        else if (query.data==="otherTime"){
            userStatus[chatId]="time"
            text="Напишите время в которое бот будет отправлять завтрашнее расписание\n<i>Вот так: <u>21:00</u></i>"
            await safeEditMessageText(bot,text,chatId,messageId);
        }

        else if (times.includes(query.data)){
            const checkTime = await findByIdTime(chatId);
            if (checkTime){
                await updateTime(chatId,query.data);
            }else {
                await addTime(chatId, query.data);
            }
            await safeEditMessageText(bot,"Время установлено✅", chatId,messageId,backToMenu.reply_markup)
        }

        else if(query.data==="updateDay"){
            userStatus[chatId]="updateDay"
            let tasks=await findById(chatId,userDayToAdd[chatId]);
            let count=1;
            text="<b>Текущие занятия:</b>\n"
            for (const task of tasks) {
                text+=`${count}.${task}\n`
                count++
            }
            text+="\n<b>Напишите заново занятия с запятой:</b>"
            await safeEditMessageText(bot,text,chatId,messageId,backToCreate.reply_markup);
        }
    }catch (error){
        console.log(error);
    }
})

bot.on('message', async message => {
    const chatId = message.chat.id;
    const messageId=message.message_id;

    if (userStatus[chatId]==="time" && message.text.includes(":")){
        const timeArray=message.text.split(":");
        if (isNaN(Number(timeArray[0]))===false || isNaN(Number(timeArray[1]))===false) {
            if (parseInt(timeArray[0]) < 24 && parseInt(timeArray[1]) < 60 && timeArray[0] > 0 && timeArray[1] > 0) {
                const checkTime = await findByIdTime(chatId);
                if (checkTime) {
                    await updateTime(chatId, message.text);
                } else {
                    await addTime(chatId, message.text);
                }
                await bot.sendMessage(chatId, "Время установлено✅", backToMenu)
                userStatus[chatId]="start";
                setTimeout(() => {
                    bot.deleteMessage(chatId, messageId)
                }, 2_000)
            } else {
                await bot.sendMessage(chatId, "Некорректное время!\nНапишите заново:", backToMenu);
            }
        }
    }

    if (userStatus[chatId]==="add" || userStatus[chatId]==="updateDay") {
        let lessons=message.text.split(",");
        let text="";
        let count=1;
        for (let element of lessons) {
            text+=`${count}.${element}\n`;
            count++;
        }
        userStatus[chatId] = "start"
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
    console.log(users)
    users.forEach(user => {
        let chatId = Number(user._id)
        console.log(chatId)
        if (tomorrow !== 7) {
            findById(chatId, tomorrow - 1)
                .then(lessons => {
                    let text = "";
                    for (const lesson of lessons) {
                        text += `${lesson}\n`;
                    }

                    bot.sendMessage(chatId, `Завтра:\n${text.length === 0 ? "<b>Не заполнено</b>" : text}`, {
                        parse_mode: "HTML",
                    });
                })
                .catch(error => {
                    console.error("Ошибка при получении уроков:", error);
                    bot.sendMessage(chatId, "Произошла ошибка при получении расписания.");
                });

        } else {
            bot.sendMessage(chatId, "Завтра <b>воскресенье</b> отдыхай!🔥", {
                parse_mode: "HTML"
            });
        }
    })

})