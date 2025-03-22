// import { jwt } from jsonwebtoken;
// import { NextFunction, Request, Response } from "express";



// const UserValidator = {
//   validateToken: async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.cookies.token;
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     try {
//       const payload = jwt.verify(token, process.env.SECRET_KEY);
//       req.user = payload;
//       next();
//     } catch (error) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }
//   },
// };