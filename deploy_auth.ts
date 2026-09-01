const command = new Deno.Command(".\\deno.exe", {
    args: ["run", "-A", "jsr:@deno/deployctl", "deploy", "--project=examples-hello-world", "server.ts"],
    stdout: "piped",
    stderr: "piped",
});

const child = command.spawn();
const decoder = new TextDecoder();
const reader = child.stderr.getReader();

console.log("Starting deployctl...");
while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    console.log(text);
}
