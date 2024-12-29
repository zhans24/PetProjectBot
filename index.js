const TelegramAPI = require('node-telegram-bot-api')
const {add:add, findById,deleteById, updateById}=require('./Database/RepoDays')
const { addedButton, startKeyboard, createDayKeyboard,delKeyboard, timeKeyboard, scheduleKeyboard, backToCreate, backToMenu, empty} = require('./Helpers/InlineKeyboards');
const token = "6993703742:AAGZLadrxQNeCqF_ZURg5O9Cl-CcClgTv6k"
const {safeEditMessageText,addText,showLessons, findTomorrow} = require('./Helpers/Functions');
const cron = require("node-cron");

const {addTime,deleteTime,findTime,updateTime, findByIdTime}=require('./Database/RepoTime')
const {addUser,findByIdUser} = require("./Database/RepoUser");

const bot = new TelegramAPI(token,{polling: true})

const daysName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const times=['18:00','21:00','00:00']
const delDaysQuery=['Пн-del', 'Вт-del', 'Ср-del', 'Чт-del', 'Пт-del', 'Сб-del']

const userStatus = {}
const userDayToAdd={}

bot.setMyCommands([
    {command:'/today',description:"Сегодняшнее расписание"},
    {command:'/tomorrow',description:"Завтрашнее расписание"},
    {command:'/start',description:"Старт"},
    {command:'/help',description:"Информация"}
])

bot.on("message", async message => {
    let text = message.text;
    let chatId = message.chat.id;
    let userId=message.from.id;
    if (text === '/start') {
        userStatus[userId] = {
            status: "start",
            lastActive: Date.now(),
        };
        userDayToAdd[userId]=-1
        if (await findByIdUser(userId)) {
            await addUser(userId, message.from.first_name, message.from.username)
        }
        return bot.sendMessage(chatId, `Привет ${message.from.first_name} 👋`, startKeyboard)
    }

    else if (text==="/today") {
        let day = new Date().getDay();
        let count = 1;

        if (day === 0) {
            return bot.sendMessage(chatId, "<b>Сегодня воскресенье</b> отдыхай!🔥</b>")
        } else {
            let lessons = await findById(chatId,day-1)
            let allLessons = `<b>Сегодня:</b>\n`;
            if (lessons.length>0) {
                for (const lesson of lessons) {
                    allLessons += `   <b>•</b> ${lesson}\n`;
                }
            }else {
                allLessons = "<b>Не заполнено\n</b>";
            }
            return bot.sendMessage(chatId,allLessons,{
                parse_mode:"HTML",
                reply_markup: {
                    inline_keyboard:[
                        [{text:"Расписание",callback_data:"Start"}]
                    ]
                }
            })
        }
    }

    else if (text==="/tomorrow") {
        await findTomorrow(bot,userId)
    }

    else if (text === '/help' && userStatus[userId]!=='add') {
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
        let userId=query.from.id;
        let messageId = query.message.message_id;

        userStatus[userId]="start"

        if (query.data === "Show" || query.data==="backToShow") {
            const lessons=await showLessons(bot,userId);
            await safeEditMessageText(bot,`${lessons}`, chatId,messageId,{
                inline_keyboard: [
                    [{text: "Редактировать✏️", callback_data: "Edit"}],
                    [{text: "Назад", callback_data: "backToSchedule"}]
                ]
            });
        }
        else if (query.data==="Edit"){
            const lessons=await showLessons(bot,userId);
            await safeEditMessageText(bot,`${lessons}`, chatId,messageId,{
                inline_keyboard: [
                    [{text: "Удалить день", callback_data: "Delete"},{text: "Удалить всё", callback_data: "Drop"}],
                    [{text: "Назад", callback_data: "backToShow"}]
                ]
            });
        }

        else if (query.data === "Delete") {
            const lessons=await showLessons(bot,userId);
            await safeEditMessageText(bot,`Какой день удалить:\n${lessons}`, chatId,messageId,delKeyboard.reply_markup);
        }

        else if (delDaysQuery.includes(query.data)){
            await deleteById(chatId,delDaysQuery.indexOf(query.data));

            await safeEditMessageText(bot,await showLessons(bot,chatId),chatId,messageId, backToCreate.reply_markup)
        }

        else if (query.data === "Drop") {
            for (let i = 0; i < 6; i++) {
                await deleteById(userId, i);
            }
            await safeEditMessageText(bot,"Расписание удалено✅",chatId,messageId, backToCreate.reply_markup)
        }

        else if (query.data === "backToMenu") {
            await safeEditMessageText(bot,`Привет ${query.from.first_name} 👋`, chatId,messageId,startKeyboard.reply_markup)
        }

        else if (query.data === "Create" || query.data === "backToCreate") {
            text = "Выбери день и заполни :";
            await safeEditMessageText(bot,text, chatId, messageId, (await createDayKeyboard(userId)).reply_markup)
        }


        else if (daysName.includes(query.data)) {
            userDayToAdd[userId] = daysName.indexOf(query.data)
            await addText(bot,chatId, messageId,userStatus);
        }

        else if (query.data === "Settings"){
            text="Выбери время для получения уведомления:"
            const checkUserTime = await findByIdTime(userId);
            if (checkUserTime)
                text=`\n<b>⏰ Текущее время :</b> ${checkUserTime}\n\n<i>Чтобы изменить выберите время😉</i>`
            await safeEditMessageText(bot,text,chatId,messageId,timeKeyboard.reply_markup)
        }

        else if (query.data==="Schedule" || query.data==="backToSchedule"){
            text="🔸 Выбери действие 🔸"
            await safeEditMessageText(bot,text,chatId,messageId,scheduleKeyboard.reply_markup);
        }

        else if (query.data==="otherTime"){
            userStatus[userId]="time"
            text="Напишите время в которое бот будет отправлять завтрашнее расписание\n<i>Вот так: <u>21:00</u></i>"
            await safeEditMessageText(bot,text,chatId,messageId,backToMenu.reply_markup);
        }

        else if (times.includes(query.data)){
            const checkTime = await findByIdTime(userId);
            if (checkTime){
                await updateTime(userId,query.data);
            }else {
                await addTime(userId, query.data);
            }
            await safeEditMessageText(bot,`Время установлено✅\n<b>Время: ${query.data}</b>`, chatId,messageId,backToMenu.reply_markup)
        }

        else if(query.data==="updateDay"){
            userStatus[userId]="updateDay"
            let tasks=await findById(userId,userDayToAdd[userId]);
            let count=1;
            text="<b>Текущие занятия:</b>\n"
            for (const task of tasks) {
                text+=`${count}.${task}\n`
                count++
            }
            text+="\n<b>Напишите заново занятия с запятой:</b>"
            await safeEditMessageText(bot,text,chatId,messageId,backToCreate.reply_markup);
        }
        else if (query.data==="Start"){
            userStatus[userId]="start"
            userDayToAdd[userId]=-1
            return safeEditMessageText(bot,`Привет ${query.from.first_name} 👋`,chatId,messageId,startKeyboard.reply_markup)
        }
    }catch (error){
        console.log(error);
    }
})

bot.on('message', async message => {
    const chatId = message.chat.id;
    const messageId=message.message_id;
    let userId=message.from.id;

    if (userStatus[userId]==="time" && message.text.includes(":")){
        const timeArray=message.text.split(":");
        if (isNaN(Number(timeArray[0]))===false || isNaN(Number(timeArray[1]))===false) {
            const hours = parseInt(timeArray[0]);
            const minutes = parseInt(timeArray[1]);

            if (hours < 24 && minutes < 60 && hours >= 0 && minutes >= 0) {
                const checkTime = await findByIdTime(userId);
                const formattedTime = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');

                if (checkTime) {
                    await updateTime(userId, formattedTime);
                } else {
                    await addTime(userId, formattedTime);
                }
                await bot.sendMessage(chatId, `Время установлено✅\n<b>⏰Время: ${formattedTime}</b>`, {
                    parse_mode:"HTML",
                    reply_markup: backToMenu.reply_markup
                })
                userStatus[userId]="start";
                setTimeout(() => {
                    bot.deleteMessage(userId, messageId)
                }, 2000)
            } else {
                await bot.sendMessage(chatId, "Некорректное время!\nНапишите заново:", backToMenu);
            }
        }
    }

    if (userStatus[userId] === "add" || userStatus[userId] === "updateDay") {
        const lessons = message.text.split(",").map(item => item.trim());
        const colors = ["🟩", "🟥", "🟧", "🟨", "🟦", "🟪", "🟫", "⬛", "⬜"];
        const usedColors = {};
        let text = "";

        for (const element of lessons) {
            if (!usedColors[element]) {
                const availableColors = colors.filter(color => !Object.values(usedColors).includes(color));
                if (availableColors.length > 0) {
                    usedColors[element] = availableColors[0];
                } else {
                    usedColors[element] = "❓";
                }
            }

            text += `${usedColors[element]} ${element}\n`;
        }

        userStatus[userId] = "start";
        const checkDay = await findById(userId, userDayToAdd[userId]);
        if (checkDay.length === 0) {
            try {
                await add(userId, lessons, userDayToAdd[userId]);
            } catch (error) {
                return bot.sendMessage(chatId, "Ошибка в добавлении к БД");
            }
        } else {
            try {
                await updateById(userId, userDayToAdd[userId], lessons);
            } catch (error) {
                return bot.sendMessage(chatId, "Ошибка обновления в БД");
            }
        }

        text += "\n<b>Все добавлено 😉</b>";
        return bot.sendMessage(chatId, text, {
            parse_mode: "HTML",
            reply_markup: addedButton.reply_markup
        });
    }
})



cron.schedule('* * * * *',async () => {
    let minutes=String(new Date().getMinutes()).padStart(2,'0');
    let hours=String(new Date().getHours()).padStart(2,'0');

    let currTime=`${hours}:${minutes}`;

    let users=await findTime(currTime)
    users.forEach(user => {
        let chatId = Number(user._id)
        findTomorrow(bot,chatId)
    })
})

setInterval(() => {
    const now = Date.now();
    for (const chatId in userStatus) {
        if (now - userStatus[chatId].lastActive > 10 * 60 * 1000) {
            delete userStatus[chatId];
            delete userDayToAdd[chatId];
            console.log(`Удалено состояние для пользователя ${chatId}`);
        }
    }
}, 5 * 60 * 1000)
