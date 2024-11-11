MONGO_URL="mongodb://localhost:27017/Schedule";

const mongoose = require('mongoose');

mongoose.connect(MONGO_URL)
    .then((res) => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

const mondaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})

const tuesdaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})

const wednesdaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})

const thursdaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})

const fridaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})

const saturdaySchema = new mongoose.Schema({
    _id: { type: BigInt, required: true },
    lessons:{
        type: Array,
        required: true,
    }
})


const Monday = mongoose.model('Monday',mondaySchema);
const Tuesday = mongoose.model('Tuesday',tuesdaySchema);
const Wednesday = mongoose.model('Wednesday',wednesdaySchema);
const Thursday = mongoose.model('Thursday',thursdaySchema);
const Friday = mongoose.model('Friday',fridaySchema);
const Saturday = mongoose.model('Saturday',saturdaySchema);


module.exports={Monday,Tuesday,Wednesday,Thursday,Friday,Saturday}
