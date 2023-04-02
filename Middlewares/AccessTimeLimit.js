const AccessModel = require('../Models/AcessModel')
const AccessTimeLimit = async (req, res, next) => {
    let data;
    const id = req.session.id;
    try {
        data = await AccessModel.findOne({id : id});
    } catch (error) {
        return res.status(400).send({
            message : 'database error',
            error : error
        })
    }

    if(!data) { 
        const accessSchema = new AccessModel({
            id : id,
            // stores time in ms
            time : Date.now()
        })
        accessSchema.save();
        return next();
    }

    try {
        const thatTime = data.time;
        const currTime = Date.now();
        const diff = Math.floor((currTime - thatTime)/1000);
        console.log('diff', diff)
        if(diff <= 2) {
            return res.status(400).send({
                message : 'please take a break, you are requesting very frequently',
            })
        }
        await AccessModel.findByIdAndUpdate(data._id, {$set: {time : Date.now()}});
    } catch(error) {
        return res.status(400).send({
            message : 'conversion error'
        })
    }

    next();
}

module.exports = {AccessTimeLimit}
