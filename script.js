<!-- 引入微信JS-SDK -->
<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
<!-- 引入文字转语音的网页应用 -->
<script src="text-to-speech.js"></script>
<!-- 引入微信收款码和支付宝收款码的地址接口 -->
<script src="payment.js"></script>
<!-- 创建一个div元素，用于显示微信扫码登录的二维码 -->
<div id="wx-login"></div>
<!-- 创建一个div元素，用于显示文字转语音的网页应用 -->
<div id="tts-app"></div>
<!-- 创建一个div元素，用于显示会员系统的按钮 -->
<div id="vip-system"></div>
<script>
  // 初始化微信JS-SDK
  wx.config({
    // 从后台获取签名
    signature: getSignature(),
    // 需要使用的JS-SDK接口列表
    jsApiList: ['scanQRCode']
  });
  // 微信JS-SDK准备好后执行
  wx.ready(function () {
    // 获取微信扫码登录的二维码
    getQRCode('wx-login', function (code) {
      // 用户扫描二维码后执行
      onScan(code, function (user) {
        // 显示用户信息
        showUserInfo(user);
        // 初始化文字转语音的网页应用
        initTTSApp('tts-app', user);
        // 初始化会员系统的按钮
        initVIPSystem('vip-system', user);
      });
    });
  });
  // 初始化文字转语音的网页应用
  function initTTSApp(elementId, user) {
    // 获取元素
    var element = document.getElementById(elementId);
    // 创建一个表单，用于输入文字
    var form = document.createElement('form');
    // 创建一个文本域，用于输入文字
    var textarea = document.createElement('textarea');
    // 设置文本域的属性
    textarea.setAttribute('name', 'text');
    textarea.setAttribute('placeholder', '请输入文字');
    textarea.setAttribute('rows', '10');
    textarea.setAttribute('cols', '50');
    // 创建一个按钮，用于提交文字
    var button = document.createElement('button');
    // 设置按钮的属性
    button.setAttribute('type', 'submit');
    button.innerText = '转换为语音';
    // 将文本域和按钮添加到表单中
    form.appendChild(textarea);
    form.appendChild(button);
    // 将表单添加到元素中
    element.appendChild(form);
    // 监听表单提交事件
    form.addEventListener('submit', function (event) {
      // 阻止默认行为
      event.preventDefault();
      // 获取用户输入的文字
      var text = textarea.value;
      // 判断用户输入的文字是否超过600字
      if (text.length > 600) {
        // 判断用户是否是会员
        if (user.isVip) {
          // 判断用户的会员等级和剩余字数是否足够
          if (user.vipLevel == 1 && user.vipLimit >= 100000 ||
              user.vipLevel == 2 && user.vipLimit >= 300000 ||
              user.vipLevel == 3 && user.vipLimit >= 1000000) {
            // 调用文字转语音的接口，传入用户输入的文字和用户的ID，获取语音文件的URL
            tts(text, user.id, function (url) {
              // 播放语音文件
              playAudio(url);
              // 更新用户的剩余字数
              updateUserVipLimit(user, text.length);
            });
          } else {
            // 提示用户升级会员或充值字数
            alert('您的会员等级或剩余字数不足，请升级会员或充值字数。');
          }
        } else {
          // 提示用户开通会员才能使用超过600字的功能
          alert('您需要开通会员才能使用超过600字的功能，请点击下方的按钮开通会员。');
        }
      } else {
        // 调用文字转语音的接口，传入用户输入的文字和用户的ID，获取语音文件的URL
        tts(text, user.id, function (url) {
          // 播放语音文件
          playAudio(url);
        });
      }
    });
  }
  // 初始化会员系统的按钮
  function initVIPSystem(elementId, user) {
    // 获取元素
    var element = document.getElementById(elementId);
    // 判断用户是否是会员
    if (user.isVip) {
      // 显示用户的会员等级和剩余字数
      showUserVipInfo(user);
      // 创建一个按钮，用于充值字数
      var rechargeButton = document.createElement('button');
      // 设置按钮的属性
      rechargeButton.innerText = '充值字数';
      // 将按钮添加到元素中
      element.appendChild(rechargeButton);
      // 监听按钮点击事件
      rechargeButton.addEventListener('click', function () {
        // 弹出一个对话框，让用户选择充值方式
        var paymentMethod = prompt('请选择充值方式：微信或支付宝。');
        // 判断用户选择的充值方式
        if (paymentMethod == '微信') {
          // 调用微信扫码支付的接口，传入用户的ID和充值金额，获取支付二维码的URL
          wxPay(user.id, 100, function (url) {
            // 显示支付二维码
            showQRCode(url);
            // 监听支付成功事件
            onPaySuccess(function () {
              // 隐藏支付二维码
              hideQRCode();
              // 提示用户支付成功
              alert('支付成功，您已充值100万字。');
              // 更新用户的剩余字数
              updateUserVipLimit(user, -1000000);
            });
          });
        } else if (paymentMethod == '支付宝') {
          // 调用支付宝扫码支付的接口，传入用户的ID和充值金额，获取支付二维码的URL
          alipay(user.id, 100, function (url) {
            // 显示支付二维码
            showQRCode(url);
            // 监听支付成功事件
            onPaySuccess(function () {
              // 隐藏支付二维码
              hideQRCode();
              // 提示用户支付成功
              alert('支付成功，您已充值100万字。');
              // 更新用户的剩余字数
              updateUserVipLimit(user, -1000000);
            });
          });
        } else {
          // 提示用户输入无效
          alert('请输入有效的充值方式。');
        }
      });
    } else {
      // 创建三个按钮，分别对应三个会员等级
      var vip1Button = document.createElement('button');
      var vip2Button = document.createElement('button');
      var vip3Button = document.createElement('button');
      // 设置按钮的属性和文本
      vip1Button.setAttribute('data-vip-level', '1');
      vip1Button.setAttribute('data-vip-price', '39');
      vip1Button.setAttribute('data-vip-limit', '100000');
      vip1Button.innerText = '开通会员（39元限量10万字）';
      vip2Button.setAttribute('data-vip-level', '2');
      vip2Button.setAttribute('data-vip-price', '59');
      vip2Button.setAttribute('data-vip-limit', '300000');
      vip2Button.innerText = '开通会员（59元限量30万字）';
      vip3Button.setAttribute('data-vip-level', '3');
      vip3Button.setAttribute('data-vip-price', '199');
      vip3Button.setAttribute('data-vip-limit', '1000000');
      vip3Button.innerText = '开通会员（199元限量100万字）';
      // 将按钮添加到元素中
      element.appendChild(vip1Button);
      element.appendChild(vip2Button);
      element.appendChild(vip3Button);
      // 监听按钮点击事件
      [vip1Button, vip2Button, vip3Button].forEach(function (button) {
        button.addEventListener('click', function () {
          // 获取按钮对应的会员等级，价格和字数限制
          var vipLevel = button.getAttribute('data-vip-level');
          var vipPrice = button.getAttribute('data-vip-price');
          var vipLimit = button.getAttribute('data-vip-limit');
          // 弹出一个对话框，让用户选择支付方式
          var paymentMethod = prompt('请选择支付方式：微信或支付宝。');
          // 判断用户选择的支付方式
          if (paymentMethod == '微信') {
            // 调用微信扫码支付的接口，传入用户的ID，会员等级和价格，获取支付二维码的URL
            wxPay(user.id, vipLevel, vipPrice, function (url) {
              // 显示支付二维码
              showQRCode(url);
              // 监听支付成功事件
              onPaySuccess(function () {
                // 隐藏支付二维码
                hideQRCode();
                // 提示用户支付成功
                alert('支付成功，您已开通' + vipLevel + '级会员。');
                // 更新用户的会员状态，等级和字数限制
                updateUserVipStatus(user, true, vipLevel, vipLimit);
                // 重新初始化会员系统的按钮
                initVIPSystem(elementId, user);
              });
            });
          } else if (paymentMethod == '支付宝') {
            // 调用支付宝扫码支付的接口，传入用户的ID，会员等级和价格，获取支付二维码的URL
            alipay(user.id, vipLevel, vipPrice, function (url) {
              // 显示支付二维码
              showQRCode(url);
              // 监听支付成功事件
              onPaySuccess(function () {
                // 隐藏支付二维码
                hideQRCode();
                // 提示用户支付成功
                alert('支付成功，您已开通' + vipLevel + '级会员。');
                // 更新用户的会员状态，等级和字数限制
                updateUserVipStatus(user, true, vipLevel, vipLimit);
                // 重新初始化会员系统的按钮
                initVIPSystem(elementId, user);
              });
            });
          } else {
            // 提示用户输入无效
            alert('请输入有效的支付方式。');
          }
        });
      });
    }
  }
</script>
