const kv = await Deno.openKv("./database.sqlite");

const adminId = "admin_default_id";
const res = await kv.get(["users", adminId]);
if (res.value) {
    res.value.username = "admin";
    await kv.set(["users", adminId], res.value);
    console.log("Updated admin username to admin");
}
