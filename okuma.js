﻿//<![CDATA[
/*!
 * Blogger Eklentileri URL=(http://bloggereklentileri.blogspot.com/)
 */
;(function($, window, document, undefined) {

  var pluginName = "kalanOkuma",
    defaults = {
      showGaugeDelay   : 1000,
      showGaugeOnStart : false,
      timeFormat       : '%mm %ss Süre',
      maxTimeToShow    : 20*60,
      minTimeToShow    : 10,
      gaugeContainer   : '',
      insertPosition   : 'prepend',
      verboseMode      : false,
      gaugeWrapper     : '',
      topOffset        : 0,
      bottomOffset     : 0
    };

  function Plugin (element, options) { this.element = element; this.settings = $.extend({}, defaults, options); this._defaults = defaults; this._name = pluginName; this.init(); }
  $.extend(Plugin.prototype, {// 1.
    init: function() {// 1.1
      var instance = this; // .scroll(function()//
      this.considerOnlyLast = 60; //
      this.pixelsMeasured = Array();
      this.timesMeasured = 0;
      this.endReached = false;
      this.updateWithNextMeasurement = false;
      this.scrollingElement = this.element;
      if ($(this.element).prop("tagName").toString().toLowerCase() == 'body') { this.scrollingElement = window; }
      this.currentScrollPos = $(this.scrollingElement).scrollTop();
      this.startScrollPos4measure = this.currentScrollPos;
      if (this.settings.gaugeContainer == '') this.settings.gaugeContainer = $(this.element); //
      var totalWordCount = $(this.element).text().split(' ').length;
      this.scrolleableContentHeight = $(this.element)[0].scrollHeight;//
      var timeNeededForTextByWordCount = Math.ceil(totalWordCount/(200/60)); //
      timeNeededForTextByWordCount += $(this.element).find('img').length*4;  //
      var wordsPerScrollablePixel = totalWordCount/this.scrolleableContentHeight;
      var initialScrollingSpeedPxs = this.scrolleableContentHeight/timeNeededForTextByWordCount; //
      this.averageScrollingSpeed = initialScrollingSpeedPxs;
      this.pixelsMeasured.push(initialScrollingSpeedPxs);
      for (var r = 2; r < this.considerOnlyLast; r++) { this.pixelsMeasured.push(initialScrollingSpeedPxs); } //
      this.measureLimit = (650/60)/wordsPerScrollablePixel; //
      var gaugeHtml = '<div class="kalanOkumaSure hidden" style="visibility:hidden;display:block;"></div>';
      if ((this.settings.insertPosition == 'prepend') || (insertPosition == ''))
        this.settings.gaugeContainer.prepend(gaugeHtml);
      else
        this.settings.gaugeContainer.append(gaugeHtml);
      this.gauge = $(instance.settings.gaugeContainer).find('.kalanOkumaSure');
      this.gaugeInitialAbsoluteTop = this.gauge.offset().top-this.currentScrollPos;
      this.gauge.attr('style', '').removeAttr('style');
      this.pixelsLeftToRead = Math.round(this.scrolleableContentHeight-this.currentScrollPos);
      if (this.settings.verboseMode) {
        console.log('Ortalama dakikada kelime başlangıç hızı: '+initialScrollingSpeedPxs.toFixed(2)+'px/s or '+(wordsPerScrollablePixel*initialScrollingSpeedPxs).toFixed(2)+'w/s ('+totalWordCount+' words in total)');
        var secondsTotal = Math.round(this.pixelsLeftToRead/initialScrollingSpeedPxs);
        console.log('Kaydırmak için toplam piksel: '+this.pixelsLeftToRead+'px at '+initialScrollingSpeedPxs.toFixed(2)+'px/s = '+Math.floor(secondsTotal/60)+'m '+(secondsTotal%60)+'s'+"\n\n");
      }
      this.updateTime();
      this.updateGauge();
      if (
        (this.settings.showGaugeOnStart) || 
        (this.currentScrollPos > 0)         //
      ) {
        this.showGauge();
      }
      $(this.scrollingElement).scroll(function() {
        instance.currentScrollPos = $(this).scrollTop();
        instance.pixelsLeftToRead = Math.round(instance.scrolleableContentHeight-instance.currentScrollPos);
        if (!((typeof instance.lastScrollTop === 'undefined') && (instance.currentScrollPos > 0)))
          instance.gauge.addClass('hidden');
        if (typeof instance.lastScrollTop === 'undefined')
          instance.lastScrollTop = instance.currentScrollPos;
        if (instance.currentScrollPos+$(instance.scrollingElement).height() == $(instance.element)[0].scrollHeight) {
          instance.endReached = true;
          instance.gauge.addClass('hidden');
          if (instance.settings.verboseMode) { console.log('Kaydırma sonuna ulaşıldı. Okumayı bitirmek için tahmini süre: '+instance.timeLeftMinutes+'m '+instance.timeLeftSeconds+'s. at '+instance.averageScrollingSpeed.toFixed(2)+'px/s'); }
          instance.finishedReadingTO = setTimeout(function() {
            if (instance.settings.verboseMode) { console.log('Estimated reading time reached.'); }
          }, instance.timeLeftTotalSeconds*1000);

        }

        clearTimeout(instance.readingTimeShowTO);
        if (instance.currentScrollPos > instance.lastScrollTop) {
          if (instance.settings.showGaugeDelay > 0) {
            instance.readingTimeShowTO = setTimeout(function() { instance.showGauge(); }, instance.settings.showGaugeDelay);
          } else {
            instance.updateGauge();
            instance.showGauge();
          }
        }
        if (instance.currentScrollPos == instance.lastScrollTop) {
          instance.updateWithNextMeasurement = true;
        }

        instance.lastScrollTop = instance.currentScrollPos;
      });
      this.measureScrollSpeedInterval = setInterval(function() {
        if (instance.currentScrollPos >= instance.startScrollPos4measure) {
          var docViewTop = $(window).scrollTop();
          var docViewBottom = docViewTop + $(window).height();

          var elemTop = $(instance.element).offset().top;
          var elemBottom = elemTop + $(instance.element).height();

          var pixelsScrolled = instance.currentScrollPos - instance.startScrollPos4measure;
          if (pixelsScrolled == 0) instance.scrollStill++; else instance.scrollStill = 0;

          if (
            ((elemTop >= docViewTop) && (elemTop <= docViewBottom)) ||
            ((elemTop <= docViewTop) && (elemBottom >= docViewBottom)) ||
            ((elemBottom >= docViewTop) && (elemBottom <= docViewBottom))
          ) {
            instance.pixelsMeasured.push(pixelsScrolled);
            instance.timesMeasured++;
            var pixelsMeasuredForAverage = 0;
            $.each(instance.pixelsMeasured, function() { pixelsMeasuredForAverage += this; });
            instance.averageScrollingSpeed = pixelsMeasuredForAverage/instance.pixelsMeasured.length;
            if (instance.averageScrollingSpeed < 1) { instance.averageScrollingSpeed = 1; }
            if (instance.averageScrollingSpeed > instance.measureLimit) { instance.averageScrollingSpeed = instance.measureLimit; }

            if (instance.settings.verboseMode) {
              var logDetail = ''; //logDetail = '['+instance.pixelsMeasured+'] '+pixelsMeasuredForAverage+'/'+instance.pixelsMeasured.length+' ';
              var secondsTotal = Math.round(instance.pixelsLeftToRead/instance.averageScrollingSpeed);
              //console.log('Measure '+('  '+instance.timesMeasured).substr(('  '+instance.timesMeasured).length-3)+': '+('   '+pixelsScrolled).substr(('   '+pixelsScrolled).length-3, 3)+'px/s. Measures: '+instance.pixelsMeasured.length+'. Average: '+instance.averageScrollingSpeed.toFixed(2)+'px/s. '+logDetail+'Pixels left to read: '+instance.pixelsLeftToRead+' = '+Math.floor(secondsTotal/60)+'m '+(secondsTotal%60)+'s');
            }

            if (instance.pixelsMeasured.length >= instance.considerOnlyLast) {
              instance.pixelsMeasured.shift();
              instance.pixelsMeasured.shift(); instance.pixelsMeasured.unshift(instance.averageScrollingSpeed);
            }
            if (instance.updateWithNextMeasurement) {
              instance.updateGauge();
              instance.updateWithNextMeasurement = false;
            }
          }
          instance.startScrollPos4measure = $(instance.element).scrollTop();
        }

      }, 1000);
    },
    //
    updateGauge: function() {
      this.settings.gaugeContainer.find('.kalanOkumaSure').html(this.getRemainingTime({ timeFormat : this.settings.timeFormat }));
    },
    //
    showGauge: function() {
      var instance = this;
      var isBetweenWrappers = false;
      if (this.settings.gaugeWrapper != '') {
        this.settings.gaugeWrapper.each(function() {
          if (!isBetweenWrappers) {
            var visibleHeightOfscrollingElement = $(this)[0].scrollHeight
            var gaugeWrapperTop = Math.round($(this).offset().top);

            isBetweenWrappers = ((instance.gaugeInitialAbsoluteTop+instance.currentScrollPos >= gaugeWrapperTop+instance.settings.topOffset) &&                                     //
            (instance.gaugeInitialAbsoluteTop+instance.currentScrollPos+instance.gauge.height() < gaugeWrapperTop+visibleHeightOfscrollingElement-instance.settings.bottomOffset)); //
          };
        });
        if (!isBetweenWrappers) { instance.gauge.addClass('hidden'); }
      } else {
        isBetweenWrappers = true;
      }

      this.updateTime();
      if ((isBetweenWrappers) &&
         (this.gauge.hasClass("hidden")) &&
         (!this.endReached) &&
         (this.timeLeftTotalSeconds < this.settings.maxTimeToShow) && 
         (this.timeLeftTotalSeconds > this.settings.minTimeToShow)
      ) {
        this.updateGauge();
        this.gauge.removeClass('hidden');
      }

    },
    //
    updateTime: function() {
      this.timeLeftTotalSeconds = Math.round(this.pixelsLeftToRead/this.averageScrollingSpeed);
      this.timeLeftMinutes = Math.floor(this.timeLeftTotalSeconds/60);
      this.timeLeftSeconds = this.timeLeftTotalSeconds-(this.timeLeftMinutes*60);
      this.timeLeftMinsFloat = (this.timeLeftMinutes+(this.timeLeftSeconds*0.0166667)).toFixed(1)*1;
      if (this.timeLeftTotalSeconds <= 0) this.gauge.addClass('hidden');
      $(this.element).data('timeLeftMinutes', this.timeLeftMinutes); //
      $(this.element).data('timeLeftSeconds', this.timeLeftSeconds);
    },
    //
    getRemainingTime: function(options) {
      //
      var leftMinutes = (typeof this.timeLeftMinutes === 'undefined') ? $(this).data('timeLeftMinutes') : this.timeLeftMinutes;
      var leftSeconds = (typeof this.timeLeftSeconds === 'undefined') ? $(this).data('timeLeftSeconds') : this.timeLeftSeconds;
      var displayText = options.timeFormat.replace(/%m/g, leftMinutes);
      displayText = (' '+displayText).replace(' 0m ', ''); //
      displayText = displayText.replace(' 0s', '');
      displayText = displayText.replace(/%s/g, leftSeconds);
      displayText = $.trim(displayText);

      return displayText;
    }
  });
  /* Blogger Eklentileri */  
  $.fn[pluginName]=function(options){if(typeof arguments[0]==="string"){var methodName=arguments[0];var args=Array.prototype.slice.call(arguments,1);var returnVal;this.each(function(){if($.data(this,"plugin_"+pluginName)&&typeof $.data(this,"plugin_"+pluginName)[methodName]==="function")returnVal=$.data(this,"plugin_"+pluginName)[methodName].apply(this,args);else throw new Error("Method "+methodName+" does not exist on jQuery."+pluginName);});if(returnVal!==undefined)return returnVal;else return this}else if(typeof options==="object"||!options)return this.each(function(){if(!$.data(this,"plugin_"+pluginName))$.data(this,"plugin_"+pluginName,new Plugin(this,options))});return this};

})(jQuery, window, document);
//]]>