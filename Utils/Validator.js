const validator = require('validator');

const validateUser = ({ email, mobile, password, name }) => {
    return new Promise((resolve, reject) => {
        if (!email || !validator.isEmail(email)) {
            reject("Invalid email");
          }
          if (!mobile || !validator.isMobilePhone(mobile)) {
            reject("Invalid mobile number");
          }
          if (!password || password.length < 8) {
            reject("Password should be at least 8 characters long");
          }
          if (!name || name.length < 3) {
            reject("Name should be at least 3 characters long");
          }
          resolve();
        })
};


module.exports = {validateUser}