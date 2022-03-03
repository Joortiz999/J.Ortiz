const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../database/user');
const db = require('../database/db');

const user = new User();
let loggeduser = "";

router.get('/', (req, res) => {
    let user = req.session.user;
    if (user) {
        res.redirect('/home');
        return;
    }
    res.render('index');

});
router.get('/home', (req, res, next) => {
    let user = req.session.user;

    if (user) {
        // Sent to home to display name 
        if (loggeduser.username == 'admin') {
            res.redirect('/admin');
            return;
        }
        res.render('user/home', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.redirect('/');
});
router.get('/admin', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            res.render('user-admin/admin-home', { opp: req.session.opp, name: loggeduser.name });
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/dashboard', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            res.render('user-admin/dashboard');
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/users', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            let sqluser = 'SELECT * FROM lucky_users';
            db.query(sqluser, (err, userdata, fields) => {
                if (err) throw err;
                res.render('user-admin/users-table', { userData: userdata });
            });
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/citas', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            let sqlcita = 'SELECT * FROM lucky_citas';
            db.query(sqlcita, (err, citadata, fields) => {
                if (err) throw err;
                res.render('user-admin/citas-table', { citaData: citadata });
            });
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/product', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            let sqlproduct = 'SELECT * FROM lucky_productos';
            db.query(sqlproduct, (err, productdata, fields) => {
                if (err) throw err;
                res.render('user-admin/product-table', { productData: productdata });
            });
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/product/add-product', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            res.render('user-admin/add-product');
        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.post('/admin/product/add-product', (req, res, next) => {
    let user = req.session.user;
    if (user) {
        if (loggeduser.username == 'admin') {
            
            if (!req.files || Object.keys(req.files).length === 0)
                return res.status(400).send('No files were uploaded.');
            
            let newProduct = { producto: req.body.producto, precio: req.body.precio, descripcion: req.body.descripcion, imagen: req.files.imagen.name};
            let file = req.files.imagen;
            
            if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {

                let uploadPath = './public/uploaded/' + file.name;
                file.mv(uploadPath, (err) => {
                    if (err) throw err;

                    let sqlproducto = `INSERT INTO lucky_productos SET ?`;
                    db.query(sqlproducto, [newProduct],  (err, result) => {
                        if (err) throw err;
                        console.log(newProduct.producto + ' Fue agregado a productos.');
                        res.redirect('/admin/product');
                    });
                    
                    return;
                })
            } else {
                res.send('This format is not allowed , please upload file with `.png`,`.gif`,`.jpg`');
            }

        } else {
            res.redirect('/unauthorized');
        }
        return;
    }
    res.redirect('/');
});
router.get('/admin/product/view/:id', (req, res)=>{
    if (loggeduser.username == 'admin') {
        db.query('SELECT * FROM lucky_productos WHERE id = ?', [req.params.id], (err, data, fields) => {
            if (err) throw err;
            res.render('test', { id: req.params.id, productData: data});
        })
    } else
        res.redirect('/unauthorized');
});
router.get('/admin/product/delete/:id', (req, res) => {
    if (loggeduser.username == 'admin') {
        db.query('DELETE FROM lucky_productos WHERE id = ?', [req.params.id], (err, rows, fields) => {
            if (!err) {
                console.log('Producto Eliminado');
                res.redirect('/admin/product');
            }
            else
                console.log(err);
        })
    } else
        res.redirect('/unauthorized');
});
// --------- START OF LOGIN SYSTEM ----
router.get('/signup', (req, res) => {
    res.render('signup');
});
// POST SIGNUP DATA
router.post('/signup', (req, res, next) => {
    let userInput = {
        name: req.body.name,
        middlename: req.body.middlename,
        phone: req.body.phone,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    };
    if (userInput.username != 'admin') {
        user.create(userInput, function (lastId) {
            if (lastId) {
                user.find(lastId, function (result) {
                    req.session.user = result;
                    req.session.opp = 0;
                    res.render('login');

                });

            } else {
                console.log('Error creating a new user ...');
                res.redirect('/');
            }
            return;
        });
    } else {
        console.log('Can`t create Admin user.')
        res.redirect('signup');
    }
});

router.get('/login', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/home', { opp: req.session.opp, name: loggeduser.name });
        return;

    }
    res.render('login');
});
// POST LOGIN DATA

router.post('/login', (req, res, next) => {
    user.login(req.body.username, req.body.password, function (result) {
        if (result) {
            req.session.user = result;
            req.session.opp = 1;
            loggeduser = (result);
            res.redirect('/home');
        } else {
            res.send('User Not found or Credentials Incorrect.');

        }
    })

});

router.get('/logout', (req, res, next) => {
    if (req.session.user) {
        req.session.destroy(function () {
            res.send('</br><h1>Logged Out. Redirect Home <a href="/">Here.</a></h1>');
        });
    }
});

// --------- END OF LOGIN SYSTEM -----
// --------- START OF SECONDARY PAGES -------
router.get('/citas', (req, res) => {
    let user = req.session.user;
    if (user) {
        res.render('user/citas-user', { opp: req.session.opp, name: loggeduser.name, email: loggeduser.email, usuario: loggeduser.username });
        return;
    }
    res.render('citas');
});

router.post('/reservar', (req, res) => {
    let user = req.session.user;
    if (user) {
        let citaInput = {
            fecha: req.body.fecha,
            hora: req.body.hora,
            usuario: loggeduser.username,
            tatuador: req.body.tatuador,
            servicio: req.body.servicio,
            status: 'Por Confirmar',
            observaciones: req.body.observaciones
        };

        db.query('INSERT INTO lucky_citas set ?', [citaInput]);
        console.log('Cita Creada');

        contentHTML = `
    <h1>Su cita ha sido Reservada correctamente</h1>
    <ul>
        <li>Nombre de Usuario: ${loggeduser.name}</li>
        <li>Email de Usuario: ${loggeduser.email}</li>
        <li>Status de Cita: ${citaInput.status}</li>
        <li>Fecha de Cita: ${citaInput.fecha}</li>
        <li>Hora de Cita: ${citaInput.hora}</li>
        <li>Reservado con: ${citaInput.tatuador}</li>
        <li>Tipo de Servicio: ${citaInput.servicio}</li>
        <li>Observaciones: ${citaInput.observaciones}</li>
    </ul>
    <p>Gracias por preferirnos ${loggeduser.name + ' ' + loggeduser.middlename}, Estaremos en contacto para confirmarle la hora de su cita, para mas información puede contactarnos por nuestro modulo de contacto o via nuestras redes sociales.</p>
    `;
        // Generate SMTP service account from ethereal.email
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                console.error('Failed to create a testing account. ' + err.message);
                return process.exit(1);
            }

            console.log('Credentials obtained, sending message...');

            // Create a SMTP transporter object
            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'curtis.quigley58@ethereal.email',
                    pass: 'MjxqRws37V7hEGxPvA'
                }
            });

            // Message object
            let message = {
                from: 'Sender Name: ' + 'CitasLucky7Tatto@Lucky.com',
                to: 'Recipient:' + `${loggeduser.email}`,
                subject: 'Nueva Cita de ' + `${loggeduser.name}`,
                //text: 'Hello to myself!',
                html: contentHTML
            };

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.log('Error occurred. ' + err.message);
                    return process.exit(1);
                }

                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                return;
            });
            return;
        });

        res.redirect('/');
        return;
    } else {
        res.redirect('login');
    }
});
// --------- START CONTACT US -------------
router.get('/contact-us', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/contact-us-user', { opp: req.session.opp, name: loggeduser.name, middlename: loggeduser.middlename, email: loggeduser.email });
        return;
    }
    res.render('contact-us');
});
router.post('/send', (req, res) => {
    const { name, email, subject, message } = req.body;

    contentHTML = `
    <h1>User Information:</h1>
    <ul>
        <li>User Name: ${name}</li>
        <li>User Email: ${email}</li>
    </ul>
    <p>${message}</p>
    `;
    // Generate SMTP service account from ethereal.email
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return process.exit(1);
        }

        console.log('Credentials obtained, sending message...');

        // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'curtis.quigley58@ethereal.email',
                pass: 'MjxqRws37V7hEGxPvA'
            }
        });

        // Message object
        let message = {
            from: 'Sender Name: ' + `${req.body.email}`,
            to: 'Recipient: CitasLucky7Tatto@Lucky.com',
            subject: `${req.body.subject}`,
            //text: 'Hello to myself!',
            html: contentHTML
        };

        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.log('Error occurred. ' + err.message);
                return process.exit(1);
            }

            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            res.redirect('/contact-us');
        });
    });
});
//--------- END CONTACT US -------------
router.get('/faq', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/faq-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('faq');
});
// --------- END OF SECONDARY PAGES -------
// ---------- START OF PAYMENT PAGES ---------
router.get('/catalog-page', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/catalog-page-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('catalog-page');
});
router.get('/product-page-cuidado-tats', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/product-page-cuidado-tats-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('product-page-cuidado-tats');
});
router.get('/product-page-targeta', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/product-page-targeta-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('product-page-targeta');
});
//----- por quitar shopping cart y payment page 
router.get('/shopping-cart', (req, res) => {
    res.render('shopping-cart');
});
router.get('/payment-page', (req, res) => {
    res.render('payment-page');
});
// --------- END OF PAYMENT PAGES ----------
// --------- START OF GALLERY PAGES ----------
router.get('/gallery', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/gallery-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('gallery');
});
router.get('/gallery_Daniel', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/gallery-Daniel-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('gallery_Daniel');
});
router.get('/gallery_Marianna', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/gallery-Marianna-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('gallery_Marianna');
});
router.get('/gallery_Brigitte', (req, res) => {
    let user = req.session.user;

    if (user) {
        res.render('user/gallery-Brigitte-user', { opp: req.session.opp, name: loggeduser.name });
        return;
    }
    res.render('gallery_Brigitte');
});
// --------- END GALLERY PAGES -----------
router.get('/unauthorized', (req, res) => {
    res.render('not-allowed');
});
//--------- UPDATE AND DELETE --------------------
router.get('/admin/users/edit/:id', (req, res) => {
    if (loggeduser.username == 'admin') {
        db.query('SELECT * FROM lucky_users WHERE id = ?', [req.params.id], (err, rows, fields) => {
            if (err) throw err;
            res.render('user-admin/editUser', { id: req.params.id, name: rows[0].name, middlename: rows[0].middlename, phone: rows[0].phone, email: rows[0].email });
        })
    } else
        res.redirect('/unauthorized');
});
router.post('/admin/users/edit/:id', (req, res, next) => {
    if (loggeduser.username == 'admin') {
        let newUserInput = { name: req.body.name, middlename: req.body.middlename, phone: req.body.phone, email: req.body.email };
        db.query('UPDATE lucky_users SET ? WHERE id = ?', [newUserInput, req.params.id], (err, result) => {
            if (err) throw err;
            console.log(result.affectedRows + " user updated");
        });
        res.redirect('/admin/users');
    } else
        res.redirect('/unauthorized');
});
router.get('/admin/users/delete/:id', (req, res) => {
    if (loggeduser.username == 'admin') {
        if (req.params.id == '14') {
            res.send('Admin Cannot be deleted');
            return;

        } else {
            db.query('DELETE FROM lucky_users WHERE id = ?', [req.params.id], (err, rows, fields) => {
                if (!err) {
                    console.log('Usuario Eliminado');
                    res.redirect('/admin/users');
                }
                else
                    console.log(err);
            })
        }
    } else
        res.redirect('/unauthorized');
});
router.get('/admin/citas/edit/:id', (req, res) => {
    if (loggeduser.username == 'admin') {
        let sqlcita = 'SELECT * FROM lucky_citas WHERE id = ?';
        db.query(sqlcita, [req.params.id], (err, citadata, fields) => {
            if (err) throw err;
            res.render('user-admin/editCita', { id: req.params.id, fecha: citadata[0].fecha, hora: citadata[0].hora, usuario: citadata[0].usuario, tatuador: citadata[0].tatuador, servicio: citadata[0].servicio, status: citadata[0].status, observaciones: citadata[0].observaciones });
        })
    } else
        res.redirect('/unauthorized');
});
router.post('/admin/citas/edit/:id', (req, res, next) => {
    if (loggeduser.username == 'admin') {
        let newCitaInput = { fecha: req.body.fecha, hora: req.body.hora, usuario: req.body.usuario, tatuador: req.body.tatuador, servicio: req.body.servicio, status: req.body.status, observaciones: req.body.observaciones };
        db.query('UPDATE lucky_citas SET ? WHERE id = ?', [newCitaInput, req.params.id], (err, result) => {
            if (err) throw err;
            console.log(result.affectedRows + " appointment updated");

            if (newCitaInput.status == 'No Disponible') {
                console.log('Enviando mail no disponible');
            }
            if (newCitaInput.status == 'Confirmada') {
                console.log('Enviando mail de aprovación de cita');
            }
            if (newCitaInput.status == 'Completada') {
                console.log('Enviando mail de cita completada');
            }
        });
        res.redirect('/admin/citas');
    } else
        res.redirect('/unauthorized');
});
router.get('/admin/citas/delete/:id', (req, res) => {
    if (loggeduser.username == 'admin') {
        db.query('DELETE FROM lucky_citas WHERE id = ?', [req.params.id], (err, rows, fields) => {
            if (!err) {
                console.log('Cita Eliminada');
                res.redirect('/admin/citas');
            }
            else
                console.log(err);
        })
    } else
        res.redirect('/unauthorized');
});

module.exports = router;
