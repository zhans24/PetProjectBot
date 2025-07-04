const {Time}=require('./Database')

async function addTime(chatId, timer) {
    try {
        let newTime = new Time({_id: chatId, time: timer});
        console.log(`${chatId} set time : ${timer}`)
        await newTime.save();
    }catch (e){
        console.error(e);
    }
}

async function updateTime(chatId, timer) {
    try {
        await Time.updateOne({_id: chatId},{$set:{time:timer}});
        console.log(`${chatId} update time : ${timer}`)
    }catch (e){
        console.error(e);
    }
}

async function deleteTime(chatId) {
    try {
        await Time.deleteOne({_id: chatId});
    }catch (e){
        console.error(e);
    }
}



async function findTime(time) {
    try {
        let timeArr=await Time.find({time: time})
        if (timeArr.length>0)
            return timeArr
        else return []
    }catch (e){
        console.error(e);
    }
}

async function findByIdTime(chatId) {
    try {
        const user=await Time.findOne({_id: chatId});
        return (user) ? user.time:null;
    }catch (e){
        console.log(e)
    }
}


module.exports = {findTime,deleteTime,updateTime,addTime,findByIdTime};