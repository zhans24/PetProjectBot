const {User}=require('./Database')

async function addUser(chatId,name,username) {
    const newUser = new User({
        _id: chatId,
        name: name,
        username: username
    })
    try {
        await newUser.save();
    }catch (error) {
        console.log(error);
    }
}

async function findByIdUser(chatId) {
    try {
        const user=await User.findOne({_id: chatId})
        return user==null;
    }catch (err){
        console.log(err);
    }
}

module.exports= {addUser,findByIdUser};