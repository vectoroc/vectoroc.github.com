
/**
 * Calendar
 *
 * required prototype & script.aculo.us
 *
 * @author vectoroc(a)gmail.com
  * @version $Revision: 47 $
 *
 *
 * changelog:
 *
 *  - fixed bug with Opera when all day cells was marked as "day_off"
 *  - removed Builder.js dependence
 *  - Appear/Fade effecs
 **/

//if (!window.debug) {
//    var debug = window.console ? console.log : Prototype.K;
//}

var Calendar = {
    MIN_YEAR : 2000,
    MAX_YEAR : 2050,
    MONTHS : $A(["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]),
    DAYS : $A(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"])
};

Object.extend(Calendar, {
    //
    //	Параметры, ожидаемые в конструкторе:
    //       id - id элемента, в который будет встроен календарь (если не задан, создаётся необходимый контейнер автоматически)
    //       date - обьект типа Date, инициализирующий дату в календаре
    //       modal - режим открытия (если true - то создаётся ширма, не позволяющая пользователю выполнять другие действия на странице)
    //       callBack - функция обратного вызова, в которую передаётся результат отработки календаря (если успешно, то обьект типа Date)
    //
    initialize: function(attr){
        attr = Object.extend({
            callBack: Prototype.emptyFunction,
            modal: false,
            hidden: false,
            date: new Date()
        }, attr);
        
        this.callBack = attr.callBack;
        this.modal = attr.modal;
        this._preventRender = true; // запрещает выполнение функции render

        if (!(this.oContainer = $(attr.id))) {
            this.oContainer = new Element("div", {
                id: attr.id || "Calendar_" + new Date().getMilliseconds()
            });
        } else {
            this.oContainer.remove();
        }
        
        this.oContainer.addClassName("Calendar").hide();
        this.createDomNodes(this.oContainer);
        
        this.oListMonth = this.oContainer.select(".ListMonth")[0];
        this.oListYear = this.oContainer.select(".ListYear")[0];
        this.oTableDays = this.oContainer.select("table")[0];
       
        this.onMouseOver = this.eventHandlerOver;
        this.onMouseOut = this.eventHandlerOut;
        this.onDblClick = this.eventHandlerDblClick.bind(this);
        this.onClick = this.eventHandlerClick.bind(this);
        this.onScreenClick = this.eventHandlerScreenClick.bind(this);
        
        this.moveTo(attr.left, attr.top);
        
        this._preventRender = false;
        this.setDate(attr.date || new Date()).render();
        if (!attr.hidden) 
            this.show();
            
        //
        // Setting up handlers
        //
        this.oListMonth.onchange = this.render.bind(this);
        this.oListYear.onchange = this.render.bind(this);
        this.oContainer.observe('click', this.onClick);
        this.oContainer.observe('dblclick', this.onDblClick);
        this.oContainer.observe('mouseover', this.eventHandlerOver);
        this.oContainer.observe('mouseout', this.eventHandlerOut);
        $(document.body).insert(this.oContainer);
    },
    
    createDomNodes: (function(){
        var html = [];
        //var add = html.push.bind(html);
        html.push("<div class='calendar_body'><center><select class='ListMonth'>");
        Calendar.MONTHS.each(function(month){
            html.push("<option>");
            html.push(month);
            html.push("</option>");
        });
        html.push("</select><select class='ListYear'>");
        $R(Calendar.MIN_YEAR, Calendar.MAX_YEAR).each(function(i){
            html.push("<option>");
            html.push(i);
            html.push("</option>");
        });
        html.push("</select><table border='0' cellspacing='1'><tr>");
        Calendar.DAYS.each(function(day, i){
            if (i < 6) {
                html.push("<td class='day_header'>");
            }
            else {
                html.push("<td class='day_off_header'>");
            }
            html.push(day);
            html.push("</td>");
        });
        html.push("</tr>");
        $R(0, 5).each(function(line){ // 8 lines
            html.push("<tr>");
            $R(0, 6).each(function(cell){ // 7 days - rows
                html.push("<td></td>");
            })
            html.push("</tr>");
        });
        html.push("</table>");
        
//value: " \u00BB " // &raquo;
//value: " \u00AB " // &laquo;
//value: " \u2039 " // &lsaquo;
//value: " \u203A " // &rsaquo;
        html.push("<input type='button' class='control PrevYear' value=' \u00AB ' />");
        html.push("<input type='button' class='control PrevMonth' value=' \u2039 ' />");
        html.push("<input type='button' class='control SetToday' style='width: 45px;' value=' Тек. ' />");
        html.push("<input type='button' class='control NextMonth' value=' \u203A ' />");
        html.push("<input type='button' class='control NextYear' value=' \u00BB ' />");
        html.push("</center></div>")
        if (Prototype.Browser.IE) {
            var nodes = "<div>" + html.join('') + "</div>";
            return function(cnt) {
                cnt.update(nodes);
            }    
        } else {
            var nodes = new Element('div').update(html.join(''));
            return function(cnt){
                cnt.insert(nodes.cloneNode(true));
            }    
        }
    })() ,
    
    eventHandlerScreenClick: function(e){
        e.stop();
        if (!e.element().descendantOf(this.oContainer)) {
            this.close();
        }
    },
    
    eventHandlerOver: function(event){
        event.stop();
        var element = event.target;
        if (element.tagName.toLowerCase() != 'td') return;
        var cn = element.className;
        if (cn == "day_off_header" || cn == "day_header" || cn == "day_disabled") return;
        if (cn != "day_selected") {
            element.className = "day_mouseover";
        }
    },
    eventHandlerOut: function(event){
        event.stop();
        var element = event.target;
        if (element.tagName.toLowerCase() != 'td') return;
        var cn = element.className;
        if (cn == "day_off_header" || cn == "day_header" || cn == "day_disabled") return;
        if (cn != "day_selected") {
            if (element.cellIndex < 6) 
                element.className = "day";
            else 
                element.className = "day_off";
        }
    },
    eventHandlerDblClick: function(event){
        var element = event.target;
        if (element.tagName.toLowerCase() != 'td') return;
        if (element.className == "day_off_header" || element.className == "day_header") return;
        this.close(this.getDate());
    },
    eventHandlerClick: function(event){
        event.stop();
        var element = event.target;
        switch(element.tagName.toLowerCase()){
            case 'td': {
                if (element.className == "day_off_header" || element.className == "day_header") return;
                var day = parseInt(element.innerHTML);
                if (element.className == "day_disabled") {
                    this._preventRender = true;
                    (day > 20) ? this.changeMonth(-1) : this.changeMonth(+1);
                    this._preventRender = false;
                }
                this.setDay(day);
                return;
            }
            case 'input': {
                switch (element.className) {
                    case 'control PrevYear': {
                        this.changeYear(-1);
                        return;                        
                    }
                    case 'control PrevMonth': {
                        this.changeMonth(-1);
                        return;                        
                    }
                    case 'control NextMonth': {
                        this.changeMonth(1);
                        return;                        
                    }
                    case 'control NextYear': {
                        this.changeYear(1);
                        return;                        
                    }
                    case 'control SetToday': {
                        this.setDate().render();
                        return;
                    }
                }
            }
        }
    },
    /**
     * Изменить текущий год на val
     **/
    changeYear: function(val){
        if (!isNaN(val) && val) {
            x_year = this.getYear() + Number(val);
            if (x_year < this.MIN_YEAR) 
                x_year = this.MIN_YEAR;
            if (x_year > this.MAX_YEAR - 1) 
                x_year = this.MAX_YEAR - 1;
            this.setYear(x_year).render();
        }
    },
    /**
     * Изменить текущий месяц на val
     **/
    changeMonth: function(val){
        if (!isNaN(val) && val) {
            var x_month = this.getMonth();
            var i = x_month + val;
            x_month = i % 12;
            if (x_month < 0) 
                x_month = x_month + 12;
            this.setDate(new Date(this.getYear() + Math.floor(i / 12), x_month, this.getDay())).render();
        }
    },
    getId: function(){
        return this._id;
    },
    getDaysInMonth: function(x_month, x_year){
        var days;
        if ($A([0, 2, 4, 6, 7, 9, 11]).include(x_month)) 
            days = 31;
        else 
            if ($A([3, 5, 8, 10]).include(x_month)) 
                days = 30;
            else 
                if (x_month == 1) {
                    if (this.isLeapYear(x_year)) {
                        days = 29;
                    }
                    else {
                        days = 28;
                    }
                }
        return (days);
    },
    isLeapYear: function(x_year){
        if (((x_year % 4) == 0) && ((x_year % 100) != 0) || ((x_year % 400) == 0)) {
            return (true);
        }
        else {
            return (false);
        }
    },
    getDate: function(){
        return new Date(this.getYear(), this.getMonth(), this.getDay());
    },
    setDate: function(x_date){
        this._preventRender = true;
        if (!(x_date instanceof Date)) 
            x_date = new Date();
        this.setDay(x_date.getDate());
        this.setMonth(x_date.getMonth());
        this.setYear(x_date.getFullYear());
        this._preventRender = false;
        return this;
    },
    getMonth: function(){
        return this.oListMonth.selectedIndex;
    },
    setMonth: function(x_month){
        this.oListMonth.selectedIndex = Math.abs(parseInt(x_month)) % this.MONTHS.length;
        return this;
    },
    getYear: function(){
        return this.oListYear.selectedIndex + this.MIN_YEAR;
    },
    setYear: function(x_year){
        this.oListYear.selectedIndex = Math.abs(parseInt(x_year) - this.MIN_YEAR) % (this.MAX_YEAR - this.MIN_YEAR + 1);
        return this;
    },
    getDay: function(){
        return this._day;
    },
    setDay: function(x_day){
        var days = this.getDaysInMonth(this.getMonth(), this.getYear());
        this._day = ((parseInt(x_day) - 1) % (days + 1)) + 1;
        this.render();
        return this;
    },
    moveTo: function(left, top){
        var point = {
            x: parseInt(left) || 0,
            y: parseInt(top) || 0
        };
        with (point) {
            this.oContainer.style.left = x + "px";
            this.oContainer.style.top = y + "px";
        }
        return this;
    },
    hide: function(){
        this.modal && Event.stopObserving.defer(document.body, "click", this.onScreenClick);
        this.oContainer.hide();
        //Effect.Fade(this.oContainer);
        return this;
    },
    show: function(){
        this.oContainer.show();
        this.modal && Event.observe.defer(document.body, "click", this.onScreenClick);
        //Effect.Appear(this.oContainer);
        return this;
    },
    /**
     * Переключение видимости
     **/
    toggle: function(){
        if (this.oContainer.visible()) 
            this.hide()
        else 
            this.show();
        return this;
    },
    /**
     * Перерисовывает календарь
     * Необходимо вызывать при всяком програмном изменении даты
     *
     **/
    render: function(){
        if (this._preventRender) 
            return;
        
        var x_day = this.getDay();
        var x_month = this.getMonth();
        var x_year = this.getYear();
        
        var days = this.getDaysInMonth(this.getMonth(), this.getYear());
        
        if (x_month > 1) 
            var days_before = this.getDaysInMonth(x_month, x_year);
        else 
            var days_before = this.getDaysInMonth(11, x_year - 1);
        
        var curr_day = 0;
        var firstOfMonth = new Date(x_year, x_month, 1);
        var startingPos = firstOfMonth.getDay() || 7; // воскресенье у буржуев - первый день
        if (startingPos == 1) 
            startingPos = 8;
        for (var i = 0; i < 42; i++) { //Days_in_week * row_count_in_table = 42
            var rowIndex = Math.floor(i / 7) + 1;
            var cellIndex = i % 7;
            var cell = this.oTableDays.rows[rowIndex].cells[cellIndex];
            curr_day = i - startingPos + 2;
            
            if (cellIndex < 6) 
                cell.className = "day";
            else {
                cell.className = "day_off";
            }
            if (curr_day <= 0) {
                cell.innerHTML = curr_day + days_before;
                cell.className = "day_disabled";
            }
            else 
                if (curr_day > 0 && curr_day <= days) {
                    cell.innerHTML = curr_day;
                }
                else 
                    if (curr_day > days) {
                        cell.innerHTML = curr_day - days;
                        cell.className = "day_disabled";
                    }
            if (curr_day == x_day) 
                cell.className = "day_selected";
        }
    },
    close: function(res){
        this.hide();
        
//        delete this.oListMonth.onchange;
//        delete this.oListYear.onchange;
        this.oContainer.stopObserving('click', this.onClick);
        this.oContainer.stopObserving('dblclick', this.onDblClick);
        this.oContainer.stopObserving('mouseover', this.eventHandlerOver);
        this.oContainer.stopObserving('mouseout', this.eventHandlerOut);
        this.oContainer.remove();
        
        if (this.callBack instanceof Function) 
            this.callBack(res);
    }
});

Calendar = Class.create(Calendar);

/**
 *
 * Получает обьект Date из строки
 *
 * date - строка
 * reverse - порядок следования (YYYY.MM.DD или DD.MM.YYYY)
 * sep - разделитель даты (по умолчанию точка)
 *
 **/
Calendar.parseDate = function(date, reverse, sep){
    sep = sep || ".";
    var res = date.toString().split(sep)
    if (res.length != 3) 
        return false;
    if (reverse) {
        return new Date(res[0], res[1] - 1, res[2]);
    }
    else {
        return new Date(res[2], res[1] - 1, res[0]);
    }
}
/**
 *
 * форматирует строковое представление даты
 *
 * date - обьект Date
 * reverse - порядок следования (YYYY.MM.DD или DD.MM.YYYY)
 * sep - разделитель даты (по умолчанию точка)
 *
 **/
Calendar.formateDate = function(date, reverse, sep){
    if (date instanceof Date) {
        sep = sep || ".";
        var day = date.getDate().toString();
        var month = (date.getMonth() + 1).toString();
        var year = date.getFullYear().toString();
        if (month.length == 1) 
            month = "0" + month;
        if (reverse) {
            return year + sep + month + sep + day;
        }
        else {
            return day + sep + month + sep + year;
        }
    }
    else 
        throw ("Invalide Date object");
}

/**
 *
 * Создаёт календарь по смещению top/left относительно обьекта obj
 * Результат записывает обратно в obj
 *
 * obj - обычно input (id или сам обьект)
 * left/top - смещение
 * id - id для создаваемого календаря (опционально)
 *
 **/
Calendar.open = function(obj, left, top, id){
    if (obj = $(obj)) {
        left = parseInt(left) || 0;
        top = parseInt(top) || 0;
        var pos = obj.cumulativeOffset();
        var calendar = new Calendar({
            id: id,
            modal: true,
            left: pos[0] - 3 + left,
            top: pos[1] - 3 + top,
            date: Calendar.parseDate(obj.value),
            callBack: function(res){
                if (res instanceof Date) {
                    obj.value = Calendar.formateDate(res);
                }
            }
        });
    }
}
