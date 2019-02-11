
import 'jquery-mask-plugin'
import 'bootstrap'
import 'bootstrap/scss/bootstrap.scss'

import './style.scss'
import './plugins.scss'

import Vue from 'vue'
import ExampleComponent from './ExampleComponent'


import('./test')

Vue.component(ExampleComponent.name, ExampleComponent);

const app = new Vue({
    el: '#app'
});


let angle = 0
function rotate(){
    angle += 360
    document.body.style.transform = `rotate(${angle}deg)`
}

document.onclick = function(){
    console.log(angle,'aaaaa')
    rotate()
}




