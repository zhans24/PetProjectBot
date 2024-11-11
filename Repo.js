const {Monday,Tuesday,Wednesday,Thursday,Friday,Saturday}=require('./Database')

const days=[Monday,Tuesday,Wednesday,Thursday,Friday,Saturday]

const add = async (chatid,lessons,day) => {
    const newLesson = new days[day]({
        _id:chatid,
        lessons: lessons,
    })
    try {
        const savedEvent = await newLesson.save();
        console.log(`Lessons added :`, savedEvent);
    } catch (error) {
        console.error(error);
    }
};

const findById = async (id, day) => {
    try {
        const doc = await days[day].findOne({ _id: id });
        return doc ? doc.lessons : [];
    } catch (error) {
        console.error(error);
        return [];
    }
};


const deleteById = async (id,day) => {
    try {
        if (findById(id,day)!==null) {
            await days[day].deleteOne({_id: id,});
        }
    }catch (error) {
        console.error(error);
    }
}

const updateById = async (id, day,updatelessons) => {
    try {
        const updated=await days[day].updateOne({_id: id},{$set:{lessons:updatelessons}});
        console.log("Updated:"+updated)
    }catch (error){
        console.error(error);
    }
}


module.exports={findById,add,deleteById,updateById}

