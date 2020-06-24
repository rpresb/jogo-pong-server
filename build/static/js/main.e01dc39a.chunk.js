(this["webpackJsonpjogo-pong"]=this["webpackJsonpjogo-pong"]||[]).push([[0],{35:function(e,t,a){e.exports=a(93)},40:function(e,t,a){},41:function(e,t,a){},70:function(e,t){},93:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),o=a(32),c=a.n(o),l=(a(40),a(41),function(e){return r.a.createElement("div",{className:"list-group"},r.a.createElement("span",{className:"list-title"},"Jogadores"),Object.keys(e.players).map((function(t){return r.a.createElement("div",{key:t,className:"list-item"},e.players[t].name)})))}),i=a(7),s=function(e){var t=Object(n.useState)(""),a=Object(i.a)(t,2),o=a[0],c=a[1];return Object(n.useEffect)((function(){var e=document.getElementById("chat-content");e.scrollTop=e.scrollHeight}),[e.messages]),r.a.createElement("div",{className:"chat-container"},r.a.createElement("div",{id:"chat-content",className:"chat-content"},e.messages.join("\n\n")),r.a.createElement("div",{className:"chat-form"},r.a.createElement("input",{type:"text",value:o,onChange:function(e){return c(e.target.value)}}),r.a.createElement("button",{disabled:!o.trim(),className:o.trim()?"":"disabled",onClick:function(){e.sendMessage(o),c("")}},"Enviar")))},m=a(34),u=a(2),d=a(33),y=a.n(d)()("https://secret-taiga-81699.herokuapp.com",{autoConnect:!1}),p=r.a.createContext(),E=function(e,t){switch(t.type){case"CONNECTED":return Object(u.a)({},e,{isConnected:t.payload});case"RESET_STATE":return Object(u.a)({},g,{isConnected:e.isConnected});case"PLAYER":return Object(u.a)({},e,{player:t.payload});case"PLAYERS":return Object(u.a)({},e,{players:t.payload});case"ROOM":if(e.players[t.payload])return Object(u.a)({},e,{room:e.rooms[e.players[t.payload].room]});case"ROOMS":return Object(u.a)({},e,{rooms:t.payload});case"MATCH":return Object(u.a)({},e,{match:t.payload});case"ADD_MESSAGE":return Object(u.a)({},e,{messages:[].concat(Object(m.a)(e.messages),[t.payload])});default:return e}},g={isConnected:!1,player:{},room:{},rooms:{},players:{},messages:[],match:{}},f=function(e){var t=Object(n.useReducer)(E,g),a=Object(i.a)(t,2),o=a[0],c=a[1];return Object(n.useEffect)((function(){y.on("connect",(function(){localStorage.getItem("player")&&y.emit("Reconnect",JSON.parse(localStorage.getItem("player"))),c({type:"CONNECTED",payload:!0})})),y.on("disconnect",(function(){c({type:"CONNECTED",payload:!1})})),y.on("PlayersRefresh",(function(e){var t=e[y.id];t?(localStorage.setItem("player",JSON.stringify(t)),c({type:"PLAYER",payload:e[y.id]})):c({type:"RESET_STATE"}),c({type:"PLAYERS",payload:e})})),y.on("ReceiveMessage",(function(e){c({type:"ADD_MESSAGE",payload:e})})),y.on("RoomsRefresh",(function(e){c({type:"ROOMS",payload:e}),c({type:"ROOM",payload:y.id})})),y.on("MatchRefresh",(function(e){c({type:"MATCH",payload:e})})),y.on("MatchClear",(function(){c({type:"MATCH",payload:{}})})),y.open()}),[]),r.a.createElement(p.Provider,{value:o},e.children)},h=function(e){y.emit("SendMessage",e)},v=function(){y.emit("CreateRoom")},S=function(){y.emit("LeaveRoom")},b=void 0,O=function(){var e=Object(n.useContext)(p),t=e.player,a=e.rooms,o=e.room;return r.a.createElement("div",{className:"list-group"},r.a.createElement("span",{className:"list-title"},"Salas",!t.room&&r.a.createElement("button",{onClick:v},"Criar Sala")),!t.room&&Object.keys(a).map((function(e){return r.a.createElement("div",{key:"room_".concat(e),className:"list-item"},a[e].name,void 0===a[e].score1&&r.a.createElement("button",{onClick:function(){return t=e,void y.emit("JoinRoom",t);var t},disabled:a[e].player1&&a[e].player2},"Entrar"),void 0!==a[e].score1&&r.a.createElement("span",null,a[e].score1," x ",a[e].score2))})),t.room&&o&&r.a.createElement("div",null,a[t.room]&&a[t.room].player1&&a[t.room].player2?r.a.createElement("button",null,"Iniciar Jogo"):r.a.createElement("div",{className:"list-item"},r.a.createElement("span",null,o.name),r.a.createElement("button",{onClick:S},"Sair"))))},C=a(4),j=a.n(C),w=function(){var e=Object(n.useContext)(p).match,t=e.gameConfig,a=e.ball,o=e.message,c=e.player1,l=e.player2;return Object(n.useEffect)((function(){y.emit("GameLoaded");var e=function(e){var t=e.key,a=e.type;switch(t){case"ArrowUp":case"ArrowDown":!function(e,t){b!==e&&(b=e,y.emit("SendKey",{type:e,key:t}))}(a,t),e.preventDefault()}};return document.addEventListener("keydown",e),document.addEventListener("keyup",e),function(){document.removeEventListener("keydown",e),document.removeEventListener("keyup",e)}}),[]),r.a.createElement("div",{style:{position:"relative"}},r.a.createElement(j.a,{width:t.width.toString(),height:t.height.toString()},r.a.createElement(C.Rect,{x:"0",y:"0",width:t.width.toString(),height:t.height.toString(),style:{fill:"rgb(0, 0, 0)"}}),r.a.createElement(C.Line,{x1:(t.width/2).toString(),y1:"0",x2:(t.width/2).toString(),y2:t.height.toString(),strokeDasharray:"5,5",strokeWidth:"5",style:{stroke:"rgba(255, 255, 255, 0.5)"}}),r.a.createElement("text",{x:(t.width/2-20).toString(),y:"45",style:{direction:"rtl",fill:"rgba(255, 255, 255, 0.7)",fontSize:"50px"}},e.score1),r.a.createElement("text",{x:(t.width/2+20).toString(),y:"45",style:{fill:"rgba(255, 255, 255, 0.7)",fontSize:"50px"}},e.score2),a&&r.a.createElement(C.Circle,{cx:a.x.toString(),cy:a.y.toString(),r:a.width.toString(),style:{fill:"#fff"}}),c&&r.a.createElement(C.Rect,{x:c.x.toString(),y:c.y.toString(),width:c.width.toString(),height:c.height.toString(),style:{fill:"rgb(255, 255, 255)"}}),l&&r.a.createElement(C.Rect,{x:l.x.toString(),y:l.y.toString(),width:l.width.toString(),height:l.height.toString(),style:{fill:"rgb(255, 255, 255)"}})),o&&r.a.createElement("div",{className:"game-message"},r.a.createElement("h4",null,o),r.a.createElement("button",{onClick:S},"Voltar")))},x=function(){var e=Object(n.useState)(""),t=Object(i.a)(e,2),a=t[0],o=t[1];return r.a.createElement("main",null,r.a.createElement("h1",null,"Seja um Programador - Pong"),r.a.createElement("section",null,r.a.createElement("form",{onSubmit:function(e){e.preventDefault(),function(e){y.emit("Login",e)}(a)}},r.a.createElement("div",{className:"input-group"},r.a.createElement("label",null,"Nome:"),r.a.createElement("input",{placeholder:"Informe o nome para entrar no jogo",value:a,onChange:function(e){return o(e.target.value)},required:!0})),r.a.createElement("button",null,"Entrar"))))},N=function(){var e=Object(n.useContext)(p),t=e.isConnected,a=e.player,o=e.players,c=e.messages,i=e.match;return t?0===Object.keys(a).length?r.a.createElement(x,null):(console.log(i.status),i.status?r.a.createElement("div",{style:{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}},r.a.createElement(w,null),r.a.createElement("pre",null,r.a.createElement("code",null,JSON.stringify(i,null,2)))):r.a.createElement("div",{style:{display:"flex",flexDirection:"row"}},r.a.createElement("div",{className:"list-container"},r.a.createElement(O,null),r.a.createElement(l,{players:o})),r.a.createElement(s,{sendMessage:h,messages:c}))):r.a.createElement("div",null,"Desconectado, conectando...")};var k=function(){return r.a.createElement("div",{className:"main-container"},r.a.createElement(f,null,r.a.createElement(N,null)))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(r.a.createElement(k,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[35,1,2]]]);
//# sourceMappingURL=main.e01dc39a.chunk.js.map