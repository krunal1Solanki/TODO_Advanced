const Auth = (req, res, next) => {
    if(req.session.isAuth) next()
    else return res.send({
        message : 'please log in again'
    })
}

module.exports = {Auth}