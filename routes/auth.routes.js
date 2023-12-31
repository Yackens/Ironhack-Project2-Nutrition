// routes/auth.routes.js
const { Router } = require('express');
const router = new Router();
const mongoose = require("mongoose");
const bcryptjs = require('bcryptjs');
const User = require('../models/User.model');
const {isLoggedIn, isLoggedOut} = require('../middlewares/route-guard-middleware')


// GET route ==> to display the log-up form to users
router.get('/', (req, res) => {
  res.render('auth/sign-up', { errorMessage: '' })
});

// GET route => to display the auth/log-in form to users
router.get('/log-in', (req, res) => {
  res.render('auth/log-in', { errorMessage: '' });
});

router.post('/', async (req, res) => {
    const { name, lastname, email, password } = req.body;
    if (!name || !lastname || !email || !password) {
        res.render('auth/sign-up', { errorMessage: 'All fields are mandatory. Please provide your name, lastname, email and password.' });
        return;
      }

    //const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    //if (!regex.test(password)) {
    //    res
    //      .status(500)
    //      .render('auth/sign-up', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    //    return;
    //  }

    try {
      const payload = { ...req.body};
      delete payload.password;
      const salt = bcryptjs.genSaltSync(10);
      const hashedPassword = bcryptjs.hashSync(req.body.password, salt);
      const userFromDB = await User.create({ name: name, lastname: lastname, email: email, password: hashedPassword });
      res.render('auth/log-in', { errorMessage: "" });
      console.log('Newly created user is: ', userFromDB);
      // Send response, etc.
    } catch(error) {
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(500).render('auth/sign-up', { errorMessage: error.message });
          } else if (error.code === 11000) {
            res.status(500).render('auth/sign-up', {
               errorMessage: "Email is already in use. Please try logging-in or use a different email."
            });
          } else {
            console.log(error);
        }
    }
  });
  

router.post("/log-in", isLoggedOut, async (req, res) => {
    const currentUser = req.body;
    const checkedUser = await User.findOne({email: currentUser.email.toLowerCase()})
    try {
        
        // console.log("currentUser:", currentUser.password);
        // console.log("checkedUser:", checkedUser.hashedPassword);
        if (checkedUser) {
            // If User exists
            if (bcryptjs.compareSync(currentUser.password, checkedUser.password)) {
                // If User exists and Password match
                const loggedUser = {...checkedUser._doc}
                delete loggedUser.hashedPassword;
                req.session.user = loggedUser; 
                res.redirect("ingredients");
            } else {
                // If User exists but Password does not match
                console.log("Password is incorrect");
                res.render("auth/log-in", { errorMessage: 'The provided credentials do not match.' });
            }
        } else {
            // If User does not exist
            res.render("auth/log-in", { errorMessage: 'The provided credentials do not match.' });
        }
        }
    catch(error) {
        console.log(error);
        res.render("auth/log-in", { errorMessage: error.message });
    }
})


// GET /logout
router.get("/log-out", isLoggedIn, (req, res) => {
  // Delete the session from the sessions collection
  // This automatically invalidates the future request with the same cookie
  req.session.destroy((err) => {
    if (err) {
      return res.render("error");
    }

    // If session was deleted successfully redirect to the sign-in page.
    res.redirect("/log-in");
  });
});



module.exports = router;
