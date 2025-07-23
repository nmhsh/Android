const storages = new Storage("LYFT")



Overlay.setState(0)
Overlay.setMove(new Point(Env.deviceW(), Env.deviceH()))
const ost = OnScreenText(0, Env.cutouts()[1])
ost.setBackgroundColor("black").setTextSize(12)
ost.show()

function MENU() {

    const menu = Dialog()
    menu.setTitle(`MENU SETTING LYFT`)
    const layout1 = LinearLayout()
    const layout2 = LinearLayout(-1, -2, 0)

    var ghinho = CheckBox("Clear Settings", false)
    layout2.addView(ghinho)
    var setup = CheckBox("Setup Color", false)
    layout2.addView(setup)
    var st = CheckBox("Show Setting", false)
    layout2.addView(st)

    layout1.addView(layout2)
    const tien = SeekBar(100, storages.getNumber("TIEN", 5), "Số tiền cho 1 đơn:", "$")
    layout1.addView(tien)
    const count_refresh = SeekBar(200, storages.getNumber("REFRESH", 5), "Số lần refresh:", "lần")
    layout1.addView(count_refresh)
    const delay_refresh = SeekBar(120, storages.getNumber("TIME", 60), "Thời gian nghỉ khi đủ số lần:", "phút")
    layout1.addView(delay_refresh)
    const time_delay = RangeSeekBar(0, 10000, storages.getNumber("MIN_DELAY", 3000), storages.getNumber("MAX_DELAY", 10000), "Time delay mỗi lần refresh:", "ms")
    layout1.addView(time_delay)
    menu.setView(layout1)
    if (menu.show() == false) {
        exit()
    }
    if(st.isChecked() == true){
        Dialog.alert(storages.getString("Color_Reserve")+"")
        exit()
        sleep(1000)
    }
    if (ghinho.isChecked() == true) {
        storages.clear()
        exit()
    } else {
        if (setup.isChecked() == true) {
            var ost1 = OnScreenText(0, Env.cutouts()[1])
            ost1.show()
            ost1.setText("CHỤP").setTextColor("red").setTextSize(30).setBackgroundColor("black")

            var arr = ["Vào màng hình đầu tiên khi nhận đơn có Reserve. Xong nhấn chụp",
                "Vào màng hình thứ 2 khi nhận đơn có Reserve. Xong nhấn chụp"
            ]

            var j = 0
            ost1.clickable(true, function () {
                j++
            })
            for (var i = 0; i < arr.length;) {
                TextToSpeech.speak(arr[i], 0, null, null)
                while (j == i) sleep(100);
                TextToSpeech.stop()
                var match = selector().text("Reserve").findOnce()
                if (match) {
                    var rect = match.bounds()
                    var x = rect.left
                    var y = rect.top
                    var p = Point(x, y)
                    storages.put("Reserve" + i, `${x}|${y}`)
                    storages.put("Color_Reserve", `${Color.get(Point(x, y)).toHex()}`)
                    console.log(storages.getString("Color_Reserve"))
                }
                i++
            }
            ost1.off()
            TextToSpeech.speak("Setup Xong, Vui lòng chạy lại", 0, null, null)
            sleep(4000)
            TextToSpeech.stop()
            exit()
        } else {
            storages.put("TIEN", tien.getProgress())
            storages.put("REFRESH", count_refresh.getProgress())
            storages.put("TIME", delay_refresh.getProgress())
            const delay = time_delay.getRange()
            storages.put("MIN_DELAY", delay[0])
            storages.put("MAX_DELAY", delay[1])

        }

    }
}





MENU()

function formatTime(ms) {
    return `${Math.floor(ms / 60000)} phút ${Math.floor((ms % 60000) / 1000)} giây`
}

const LYFT = {
    DATA: {
        TIEN: storages.getNumber("TIEN", 5),
        COUNT_REFRESH: storages.getNumber("REFRESH", 5),
        TIME_REFRESH: storages.getNumber("TIME", 60),
        MIN_DELAY: storages.getNumber("MIN_DELAY", 1000),
        MAX_DELAY: storages.getNumber("MAX_DELAY", 4000)
    },
    W: Env.deviceW(),
    H: Env.deviceH(),
    isCheck: "L",
    count: 0,
    time_refresh: 0,
    tien: [],
    show: function () {
        ost.setText(`<font color="green">&#8226; Số Lần Refresh : ${this.count} lần</font><br><font color="green">&#8226; Time Đợi Refresh : ${this.time_refresh}</font><br><font color="red">&#8226; Tìm Thấy : [${this.tien}]</font>`)
    },
    isCheckView: () => {
        return (selector().text("Airport").findOnce() != null)
    },
    swipe: function () {
        var w = this.W
        var h = this.H
        if (this.isCheck == "L") {
            Touch.swipe(w / 2, h / 2.5, w / 2 + 100, h / 2.5, 300)
            this.isCheck = "R"
        } else {
            Touch.swipe(w / 2, h / 2.5, w / 2 - 100, h / 2.5, 300)
            this.isCheck = "L"
        }
    },
    filterTien: function () {
        var match = selector().idEndsWith("map_bubble").clickable(true).filter((view) => {
            return view.child(0)?.className() == "android.widget.TextView"
        }).find()

        var arr = []
        match.toArray().forEach(element => {
            var text = element.child(0)?.text() || ""
            
            if (text.startsWith("$")) {
                var t =text.split(" ")[0].replace(/\D/g, "")
                t = Number(t)
                arr.push({
                    TIEN: t,
                    NODE: element
                })
            }
        });
        arr = arr.sort((a, b) => b.TIEN - a.TIEN)
        this.tien = arr.map(i => i.TIEN)
        return (arr.length == 0) ? false : arr
    },
    start: function () {
        this.show()
        if (this.count >= this.DATA.COUNT_REFRESH) {
            var time = Date.now()
            const time_wait = this.DATA.TIME_REFRESH * 60000
            while (this.count > 0) {
                this.time_refresh = time_wait - (Date.now() - time)
                if (this.time_refresh <= 0) {
                    this.count = 0;
                    this.time_refresh = 0;
                    break
                }
                ost.setText(`<font color="green">&#8226; Đã đủ số lần refresh : ${this.count} lần</font><br><font color="green">&#8226; Time Đợi Refresh : ${formatTime(this.time_refresh)}</font>`)
                sleep(100)
            }
        }
        if (!this.isCheckView()) {
            selector().desc("Open menu").findOnce()?.click()
            selector().text("Scheduled Rides").findOnce()?.parent().click()
            selector().text("Got it").findOnce()?.parent().click()
        } else {
            this.swipe()
            var refresh = selector().text("Search this area").findOnce()
            if (refresh) {
                refresh.parent()?.click()
                this.count++
            }
            this.show()
            var time = Date.now()
            var random_time = random(this.DATA.MIN_DELAY, this.DATA.MAX_DELAY)
            this.time_refresh = 0
            while (Date.now() - time < random_time) {
                this.time_refresh = random_time - (Date.now() - time)
                this.show()
                var match = this.filterTien()
                if (match && match[0].TIEN >= this.DATA.TIEN) {
                    this.time_refresh = 0
                    this.show()
                    match[0].NODE.click()
                    match[0].NODE.click()
                    var str_point = storages.getString("Reserve0").split("|")
                    var point = Point(Number(str_point[0]), Number(str_point[1]))
                    var str_point1 = storages.getString("Reserve1").split("|")
                    var point1 = Point(Number(str_point1[0]), Number(str_point1[1]))
                    var color_ = Color(storages.getString("Color_Reserve"))
                    var stop = Date.now()
                    while (Date.now() - stop <= 7000) {
                        if (Color.deltaE(Color.get(point), color_) < 20) {
                            point.click()
                        } else {
                            if (Color.deltaE(Color.get(point1), color_) < 20) {
                                point1.click()
                                break
                            }
                        }
                        sleep(10)
                    }
                    var check = false
                    while (true) {
                        if (selector().desc("Close").clickable(true).findOnce()?.click()) {
                            sleep(3000)
                        }
                        if (selector().desc("Open menu").findOnce() || this.isCheckView()) {
                            check = true
                        }
                        if (check) {
                            break
                        } else {
                            if (!selector().desc("OK").findOnce()?.click()) {
                                Touch.back()
                                sleep(3000)
                            }
                        }
                        sleep(10)
                    }
                }
                sleep(10)
            }
        }
    }
}



while (true) {
    LYFT.start()
    sleep(10)
}

