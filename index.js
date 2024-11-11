const TelegramAPI = require('node-telegram-bot-api')
const {add:add, findById,deleteById, updateById}=require('./Repo')
let { addedButton, startKeyboard, createDayKeyboard, backToCreate, backToMenu } = require('./InlineKeyboard');const token = "6993703742:AAGZLadrxQNeCqF_ZURg5O9Cl-CcClgTv6k"

const bot = new TelegramAPI(token,{polling: true})

const days = [0,1,2,3,4,5];
const daysName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const userStatus={}

bot.setMyCommands([
    {command:'/start',description:"Start bot"},
    {command:'/show',description:"show schedule"},
    {command:'/help',description:"Info"}
])



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

let day=-1;


bot.on("callback_query", async query => {
    console.log(query.data);

    let chatId=query.message.chat.id;
    let messageId=query.message.message_id;

    if (query.data === "Show") {
        return show(chatId,messageId)
    }

    if (query.data==="Drop"){
        for (let i = 0; i < 6; i++) {
            await deleteById(chatId, i);
        }
        await bot.editMessageText("Расписание удалено",{
            chat_id: chatId,
            message_id: messageId,
            reply_markup:backToMenu.reply_markup
        })
    }

    if (query.data==="backToMenu"){
            await bot.editMessageText('Привет '+query.message.chat.first_name, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startKeyboard.reply_markup
        });
    }

    if (query.data==="Create" || query.data==="backToCreate") {
        await bot.editMessageText("Выбери день и заполни :", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: (await createDayKeyboard(chatId)).reply_markup,
        })
    }


    if (daysName.includes(query.data)) {
        day=daysName.indexOf(query.data)
        await addText(chatId, messageId);
    }



})

/*
    Add lessons part
 */
async function addText(chatId, messageId) {
    userStatus[chatId]="add";
    await bot.editMessageText("Напишите занятия в ряд с пробелом\n\n<b>Вот так</b> : <i>Первый второй третий ...</i>", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode:"HTML",
        reply_markup: backToCreate.reply_markup
    });
}


async function show(chatId,messageId) {

    let allLessons = '';
    let lessonPromises = days.map(index => findById(chatId, index));

    try {
        const lessonsResults = await Promise.all(lessonPromises);
        daysName.forEach((day, index) => {
            allLessons += `${day}: ${lessonsResults[index]?.length > 0 ? lessonsResults[index].join(', ') : 'No lessons'}\n`;
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        allLessons = 'Error fetching lessons from the database.';
    }

    return await bot.editMessageText(`Расписание на всю неделю:\n${allLessons}`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [{text: "Удалить всё", callback_data: "Drop"}],
                [{text: "Назад", callback_data: "backToMenu"}]
            ]
        }
    });
}

/*
  Add lessons to db
 */

bot.on('message', async message => {
    const chatId = message.chat.id;
    let lessons=message.text.split(" ");

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




