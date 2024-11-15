const {findById} = require("../Database/RepoDays");



const startKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{text:"Расписание",callback_data: "Schedule"}],
            [{text: "Параметры",callback_data:"Settings"}]
        ]
    }
}

const scheduleKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{text:"Добавить расписание",callback_data:"Create"}],
            [{text:"Показать расписание",callback_data:"Show"}],
            [{text:"Назад",callback_data:"backToMenu"}]
        ]
    }
}

const days = [0,1,2,3,4,5];

const getSavedDaysStatus = async (chatId) => {
    const savedDaysStatus = [];
    for (let i = 0; i < days.length; i++) {
        const dayLessons = await findById(chatId, i);
        savedDaysStatus[i] = dayLessons.length > 0;
    }
    return savedDaysStatus;
};

const createDayKeyboard = async (chatId) => {
    const savedDaysStatus = await getSavedDaysStatus(chatId);

    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `1.Понедельник ${savedDaysStatus[0] ? '✅' : ''}`, callback_data: "Пн" },
                    { text: `4.Четверг ${savedDaysStatus[3] ? '✅' : ''}`, callback_data: "Чт" }
                ],
                [
                    { text: `2.Вторник ${savedDaysStatus[1] ? '✅' : ''}`, callback_data: "Вт" },
                    { text: `5.Пятница ${savedDaysStatus[4] ? '✅' : ''}`, callback_data: "Пт" }
                ],
                [
                    { text: `3.Среда ${savedDaysStatus[2] ? '✅' : ''}`, callback_data: "Ср" },
                    { text: `6.Суббота ${savedDaysStatus[5] ? '✅' : ''}`, callback_data: "Сб" }
                ],
                [{ text: "Назад", callback_data: "backToSchedule" }]
            ]
        }
    };
}

const addedButton = {
    reply_markup: {
        inline_keyboard: [
            [{text:"Другие дни",callback_data:"backToCreate"}],
            [{text:"Показать расписание",callback_data:"Show"}]
        ]
    }
}

const backToCreate = {
    reply_markup: {
        inline_keyboard: [[{
            text: "Назад",
            callback_data: "backToCreate"
        }]]
    }
}

const backToSchedule = {
    reply_markup: {
        inline_keyboard: [
            [{text:"Назад",callback_data:"backToSchedule"}],
        ]
    }
}

const backToMenu = {
    reply_markup: {
        inline_keyboard: [[{
            text: "Назад",
            callback_data: "backToMenu"
        }]]
    }
}

const timeKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{text:"18:00",callback_data:"18:00"},{text:"21:00",callback_data:"21:00"},{text:"00:00",callback_data:"00:00"}],
            [{text: "Другое время",callback_data: "otherTime"}],
            [{text:"Назад",callback_data: "backToMenu"}]
        ]
    }
}


module.exports = {
    startKeyboard,
    addedButton,
    backToCreate,
    backToMenu,
    createDayKeyboard,
    timeKeyboard,
    scheduleKeyboard
};