/*
 * Built by Gemini 3
 */

import { type Request, type Response, type NextFunction } from 'express'
import { UserModel } from '../models/user'
import { BasketModel } from '../models/basket'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'
import https from 'https'

export function oauthLogin() {
    return (req: Request, res: Response, next: NextFunction) => {
        const accessToken = req.body.accessToken

        const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`

        https.get(url, (apiRes) => {
            let data = ''
            apiRes.on('data', (chunk) => {
                data += chunk
            })
            apiRes.on('end', () => {
                if (apiRes.statusCode !== 200) {
                    return res.status(401).json({ error: 'Invalid access token' })
                }

                try {
                    const profile = JSON.parse(data)
                    const email = profile.email

                    if (!email) {
                        return res.status(401).json({ error: 'Could not retrieve email from token' })
                    }

                    UserModel.findOne({ where: { email } }).then((authenticatedUser: any) => {
                        if (authenticatedUser) {
                            const user = utils.queryResultToJson(authenticatedUser)
                            loginUser(user, res, next)
                        } else {
                            UserModel.create({
                                email,
                                password: utils.randomHexString(16),
                                role: 'customer',
                                deluxeToken: '',
                                lastLoginIp: req.ip,
                                profileImage: '/assets/public/images/uploads/default.svg',
                                totpSecret: '',
                                isActive: true
                            }).then((newUser: any) => {
                                const user = utils.queryResultToJson(newUser)
                                loginUser(user, res, next)
                            }).catch((err: any) => {
                                next(err)
                            })
                        }
                    }).catch((err: any) => {
                        next(err)
                    })

                } catch (e) {
                    next(e)
                }
            })
        }).on('error', (e) => {
            next(e)
        })
    }

    function loginUser(user: { data: any, bid?: number }, res: Response, next: NextFunction) {
        BasketModel.findOrCreate({ where: { UserId: user.data.id } })
            .then(([basket]: [BasketModel, boolean]) => {
                const token = security.authorize(user)
                user.bid = basket.id
                security.authenticatedUsers.put(token, user)
                res.json({ authentication: { token, bid: basket.id, umail: user.data.email } })
            }).catch((error: Error) => {
                next(error)
            })
    }
}
