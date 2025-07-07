import express, {Express, Request, Response} from "express"
import { env } from "../config/env.config";
import { Http } from "@status/codes";
import { AuthRoutes } from "../routers/authRouter";

const app:Express = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.status(Http.Ok).json({
        message: "it's working"
    })
})

app.use("/auth", AuthRoutes);

export default function loadServer() {
    app.listen(env.PORT, () => {
        console.log(`server running at ${env.PORT}`);
        
    })
}