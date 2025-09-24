import { exec } from "child_process";

export class CmdUtil {
    public static async exec(cmd: string) {
        const { stdout, stderr } = await exec(cmd);
        return { stdout, stderr };
    }
}
