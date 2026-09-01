const command = new Deno.Command(".\\deno.exe", {
    args: ["run", "-A", "npm:localtunnel", "--port", "8000"],
    stdout: "piped",
    stderr: "piped",
});

const child = command.spawn();
const decoder = new TextDecoder();
const reader = child.stdout.getReader();

console.log("Starting localtunnel...");
while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    console.log(text);
}
