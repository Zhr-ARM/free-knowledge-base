---
layout: home

hero:
  name: 开源协会知识库
  text: 嵌入式与机器人运动控制资料站
  tagline: 面向协会成员和学习者，集中查找课程讲义、实验指导、项目资料和技术路线。
  actions:
    - theme: brand
      text: 浏览资料库
      link: /library/
    - theme: alt
      text: 如何查找
      link: /guide/contribute

features:
  - title: 嵌入式
    details: C 语言、51 单片机、STM32、实时系统、ESP32、硬件设计和协会培训资料。
  - title: 机器人运动控制
    details: 电机控制、FOC、强化学习和机器人学习路线；尚未收录的方向会明确标注。
  - title: 资料状态清晰
    details: 已收录资料会直接显示；暂未收录的分类会标记“暂无资料”。
---

<script setup>
import { withBase } from 'vitepress'
</script>

<div class="kb-brand-strip">
  <img class="kb-brand-association" :src="withBase('/association-logo.jpg')" alt="开源协会标识">
  <div class="kb-brand-copy">
    <p class="kb-eyebrow">Open Source Association</p>
    <strong>成都理工大学开源协会资料站</strong>
    <span>聚合课程、项目和技术路线，面向学习者开放查阅。</span>
  </div>
  <img class="kb-brand-university" :src="withBase('/cdut-logo.png')" alt="成都理工大学">
</div>

<div class="kb-section">
  <div>
    <p class="kb-eyebrow">Find fast</p>
    <h2>从分类开始，再用搜索缩小范围</h2>
    <p>如果你不确定资料名称，先进入资料库按方向浏览；如果知道关键词，可以直接搜索课程名、芯片型号、控制算法或项目主题。</p>
  </div>
  <div class="kb-link-grid">
    <a class="kb-link-card" href="/library/">
      <strong>资料库</strong>
      <span>查看所有已公开资料</span>
    </a>
    <a class="kb-link-card" href="/guide/embedded">
      <strong>嵌入式</strong>
      <span>查看硬件、驱动和 MCU 资料</span>
    </a>
    <a class="kb-link-card" href="/guide/robot-motion-control">
      <strong>机器人运动控制</strong>
      <span>查看 ROS、控制和机器人资料</span>
    </a>
  </div>
</div>
