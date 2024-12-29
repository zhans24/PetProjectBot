const {backToCreate} = require("./InlineKeyboards");
const {findById} = require("../Database/RepoDays");
const cron = require("node-cron");
const {findTime, findByIdTime} = require("../Database/RepoTime");
const e = require("express");

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
    await bot.editMessageText("Напишите занятия с запятой\n\n<b>Вот так</b> : <i>Дело 1 <b>16:00</b>, Дело 2, Дело 3 ...</i>", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode:"HTML",
        reply_markup: backToCreate.reply_markup
    });
}


async function showLessons(bot, chatId) {
    let allLessons = '';
    let lessonPromises = days.map(index => findById(chatId, index));

    const colors = ["📘", "📕", "📗", "📙", "📓", "📔"];

    try {
        const lessonsResults = await Promise.all(lessonPromises);
        let count = 1;

        for (const day in daysName) {
            const colorIndex = day % colors.length;
            allLessons += `${colors[colorIndex]} <b>${daysName[day]}:</b>\n`;

            if (lessonsResults[day]?.length > 0) {
                for (const lesson of lessonsResults[day]) {
                    allLessons += `   <b>${count}.</b> ${lesson}\n`;
                    count++;
                }
                count = 1;
            } else {
                allLessons += "   <b>Не заполнено</b>\n";
            }
            allLessons+="\n"
        }
        return allLessons;
    } catch (error) {
        console.error('Ошибка БД:', error);
    }
}

async function findTomorrow(bot,chatId){
    let tomorrow = new Date().getDay() + 1;

    if (tomorrow !== 7) {
        findById(chatId, tomorrow - 1)
            .then(lessons => {
                let text = "";
                for (const lesson of lessons) {
                    text += `${lesson}\n`;
                }

                bot.sendMessage(chatId, `Завтра:\n${text.length === 0 ? "<b>Не заполнено</b>" : text}`, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard:[
                            [{text:"Расписание",callback_data:"Start"}]
                        ]
                    }
                });
            })
            .catch(error => {
                console.error("Ошибка при получении уроков:", error);
                bot.sendMessage(chatId, "Произошла ошибка при получении расписания.");
            });

    } else {
        await bot.sendMessage(chatId, "Завтра <b>воскресенье</b> отдыхай!🔥", {
            parse_mode: "HTML"
        });
    }
}


module.exports={safeEditMessageText,showLessons,addText,findTomorrow}