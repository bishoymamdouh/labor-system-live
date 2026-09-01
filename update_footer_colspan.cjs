const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");
content = content.replace(
    '<td colspan="2"></td>\n                                </tr>\n                            </tbody>\n                        </table>',
    '<td colspan="3"></td>\n                                </tr>\n                            </tbody>\n                        </table>'
);
fs.writeFileSync("index.html", content);
console.log("Updated footer colspan");
