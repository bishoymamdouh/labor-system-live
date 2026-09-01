const command = new Deno.Command(".\\deno.exe", {
  args: ["run", "-A", "https://deno.land/x/localtunnel@1.0.0/cli.ts", "--port", "8000"],
  stdout: "piped",
  stderr: "piped",
});

const child = command.spawn();

const decoder = new TextDecoder();
for await (const chunk of child.stdout) {
  console.log(decoder.decode(chunk));
}
