const {backToCreate} = require("./InlineKeyboards");
const {findById} = require("../Database/RepoDays");
const cron = require("node-cron");

const days = [0,1,2,3,4,5];
const daysName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

async function safeEditMessageText(bot, text, chatId, messageId, form) {
    try {
        const currentMessage = await bot.getChat(chatId).then(chat => chat?.message);
        const isTextSame = currentMessage?.text === text;
        const isMarkupSame = JSON.stringify(currentMessage?.reply_markup || {}) === JSON.stringify(form || {});

        if (isTextSame && isMarkupSame) {
            console.log("Query is repeated one more time!");
            return;
        }

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: form,
        });
    } catch (error) {
        console.error("Error editing message:", error);
    }
}


async function addText(bot,chatId, messageId,userStatus) {
    userStatus[chatId]="add";
    await bot.editMessageText("Напишите занятия в ряд с пробелом\n\n<b>Вот так</b> : <i>Первый второй третий ...</i>", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode:"HTML",
        reply_markup: backToCreate.reply_markup
    });
}

async function show(bot,chatId,messageId) {

    let allLessons = '';
    let lessonPromises = days.map(index => findById(chatId, index));

    try {
        const lessonsResults = await Promise.all(lessonPromises);
        daysName.forEach((day, index) => {
            allLessons += `${day}: ${lessonsResults[index]?.length > 0 ? lessonsResults[index].join(', ') : ' <b>Не заполнено</b>'}\n`;
        });
    } catch (error) {
        console.error('Ошибка БД:', error);
        allLessons = 'ОШИБКА В БД!';
    }

    await safeEditMessageText(bot,`Расписание на всю неделю:\n<b>${allLessons}</b>`, chatId,messageId,{
        inline_keyboard: [
            [{text: "Удалить всё", callback_data: "Drop"}],
            [{text: "Назад", callback_data: "backToSchedule"}]
        ]
    });
}

const timeStorage = {}

async function setTime(bot, chatId, time) {
    let [hours,minutes]=time.split(":")

    if (timeStorage[chatId]){
        timeStorage[chatId].stop();
    }

    timeStorage[chatId]=cron.schedule(`${minutes} ${hours} * * *`, async () => {


    })
}
module.exports={safeEditMessageText,show,addText}