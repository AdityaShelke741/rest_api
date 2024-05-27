import { createUser, getUsersByEmail } from 'db/users';
import express from 'express';
import { authentication, random } from 'helpers';

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.sendStatus(400);
        }

        const user = await getUsersByEmail(email).select('+authentication.salt +authentication.password');

        if (!user) {
            return res.sendStatus(400);
        }

        const bufferHash = authentication(user.authentication.salt, password);

        if (user.authentication.password !== bufferHash) {
            return res.sendStatus(403);
        }
        
        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());

        await user.save();

        res.cookie('ADITYA-AUTH', user.authentication.sessionToken, {domain: 'localhost', path: '/'});
        return res.status(200).json(user).end();
        
    } catch (error) {
        console.log(error)
        return res.sendStatus(400);
    }
}



export const register = async (req: express.Request, res: express.Response) => {
    try {
        const {email, username, password} = req.body;
        
        if (!email || !username || !password) {
            return res.sendStatus(400);
        }

        const existingUser = await getUsersByEmail(email);

        if (existingUser){
            return res.sendStatus(400);
        }

        const salt = random();
        const user = await createUser({
            email, 
            username,
            authentication: {
                salt,
                password: authentication(salt, password),
            },
        });

        return res.status(200).json(user).end(); 

    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
}