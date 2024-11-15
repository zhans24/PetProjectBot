const {time} = require('Database')

let t1=new time({
    _id:1,
    time:"21:00"
});

try {
    await t1.save();
}catch (error){
    console.error(error);
}
