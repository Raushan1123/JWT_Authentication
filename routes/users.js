const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
//const auth = require("../middlewares/auth");

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

const User = require("../models/users");

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */

router.get('/signup',(req,res,next)=>{
    return res.render('signup',{title:'Sign Up'})
})

router.post(
  "/signup",
  [
    // check("fname", "Please Enter a Valid Username")
    //   .not()
    //   .isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {

      var user =new User({
        fname:req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: req.body.password,
      });
      console.log(user.password);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);

      await user.save();
    //   user.save(user,(err,result)=>{
    //     if(err) return next(err)
    //     res.status(201).json(result);
    // })

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          //res.status(200).json({token});
       res.redirect('/login')
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.get('/login',(req,res,next)=>{
    return res.render('login',{title:'Log In'})
})

router.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user)
        return res.status(400).json({
          message: "User Not Exist"
        });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({

          message: "Incorrect Password !"
        });
        var first = user.fname;
        var last = user.lname;
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 3600
        },
        (err, token,first,last) => {
          if (err) throw err;
          // res.status(200).json({
          //   token
          // });
         res.status(200).json(
           {
             message: "Username has successfully logged in",
             first,
            last
            });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);
//module.exports = token;
const checkToken = (req, res, next) => {
  const header = req.headers['authorization'];

  if(typeof header !== 'undefined') {
      const bearer = header.split(' ');
      const token = bearer[1];

      req.token = token;
      next();
  } else {
      //If header is undefined return Forbidden (403)
      res.sendStatus(403)
  }
}

router.get('/profile', checkToken, (req, res) => {
  //verify the JWT token generated for the user
  jwt.verify(req.token, 'randomString', (err, authorizedData) => {
      if(err){
          //If error send Forbidden (403)
          console.log('ERROR: Could not connect to the protected route');
          res.sendStatus(403);
      } else {
          //If token is successfully verified, we can send the autorized data 
          res.json({
              message: 'Successful log in',
              authorizedData
          });
          console.log('SUCCESS: Connected to protected route');
      }
  })
});




module.exports = router;