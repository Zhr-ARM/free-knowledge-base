---
layout: page
sidebar: false
aside: false
outline: false
title: 成都理工大学开源协会
description: 开源协会官网，展示协会方向、项目活动，并提供嵌入式与机器人运动控制学习资料。
---

<script setup>
import { withBase } from 'vitepress'
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  CircuitBoard,
  Cpu,
  HeartHandshake,
  UsersRound
} from '@lucide/vue'
</script>

<main class="osa-site osa-home">
  <section class="osa-hero" aria-labelledby="osa-home-title">
    <img
      class="osa-hero-media"
      :src="withBase('/association/hero-group.webp')"
      alt="成都理工大学开源协会成员合影"
      width="2000"
      height="1333"
      fetchpriority="high"
      decoding="async"
    >
    <div class="osa-hero-shade" aria-hidden="true"></div>
    <div class="osa-shell osa-hero-inner">
      <div class="osa-hero-copy">
        <p class="osa-kicker">成都理工大学 · 学术科技类学生社团</p>
        <h1 id="osa-home-title">开源协会</h1>
        <p class="osa-hero-lead">把好奇心焊进电路，把想法写进代码。我们围绕嵌入式与机器人运动控制，在学习、实践和分享中一起做出真正能运行的作品。</p>
        <div class="osa-actions">
          <a class="osa-button osa-button-primary" :href="withBase('/library/')">
            <BookOpen :size="19" aria-hidden="true" />
            浏览资料库
          </a>
          <a class="osa-button osa-button-quiet" :href="withBase('/association/')">
            认识协会
            <ArrowRight :size="18" aria-hidden="true" />
          </a>
        </div>
      </div>
      <dl class="osa-hero-stats" aria-label="协会概况">
        <div>
          <dt>2015</dt>
          <dd>协会成立</dd>
        </div>
        <div>
          <dt>236</dt>
          <dd>协会成员</dd>
        </div>
        <div>
          <dt>2</dt>
          <dd>核心技术方向</dd>
        </div>
      </dl>
    </div>
  </section>

  <section class="osa-band osa-intro-band">
    <div class="osa-shell osa-intro-grid">
      <div class="osa-section-copy">
        <p class="osa-kicker">关于我们</p>
        <h2>从第一行代码，到第一台会动的机器人</h2>
        <p>开源协会面向对电子、软件和机器人感兴趣的同学。这里既有从 C 语言、单片机开始的基础训练，也有 RTOS、ROS、运动控制和智能系统等进阶实践。</p>
        <p>协会以“开放、平等、共享、协作”为共同准则，让经验可以被复用，让每一次踩坑都能成为下一位同学的起点。</p>
        <a class="osa-text-link" :href="withBase('/association/')">
          查看协会介绍
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
      </div>
      <figure class="osa-feature-photo">
        <img :src="withBase('/association/training-bench.webp')" alt="协会成员在电子实验台前进行实践训练" width="1400" height="1050" loading="lazy" decoding="async">
        <figcaption>从理论讲解到上手调试，项目实践是协会学习的重要一环。</figcaption>
      </figure>
    </div>
  </section>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">技术方向</p>
          <h2>两条主线，一套从基础到项目的学习路径</h2>
        </div>
        <a class="osa-text-link" :href="withBase('/library/')">
          进入知识库
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
      </div>
      <div class="osa-directions">
        <article class="osa-direction">
          <span class="osa-icon-box"><Cpu :size="25" aria-hidden="true" /></span>
          <div>
            <h3>嵌入式</h3>
            <p>C 语言、51 单片机、STM32、RTOS、ESP32、Linux 与硬件设计，逐步建立软硬件协同能力。</p>
            <a :href="withBase('/guide/embedded')">查看方向资料 <ArrowRight :size="16" aria-hidden="true" /></a>
          </div>
        </article>
        <article class="osa-direction">
          <span class="osa-icon-box osa-icon-box-red"><Bot :size="25" aria-hidden="true" /></span>
          <div>
            <h3>机器人运动控制</h3>
            <p>从电机控制与 FOC 出发，延伸到 ROS、移动机器人、强化学习和完整机器人系统。</p>
            <a :href="withBase('/guide/robot-motion-control')">查看方向资料 <ArrowRight :size="16" aria-hidden="true" /></a>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-band osa-muted-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">项目实践</p>
          <h2>让方案离开文档，在真实环境里跑起来</h2>
        </div>
        <a class="osa-text-link" :href="withBase('/association/projects')">
          全部项目
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
      </div>
      <div class="osa-card-grid osa-project-preview">
        <article class="osa-media-card">
          <img :src="withBase('/association/spherical-detector.webp')" alt="双模态球形智能探测系统原型" width="544" height="613" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">智能探测</span>
            <h3>双模态球形智能探测系统</h3>
            <p>面向管道、矿井和狭窄空间，探索空地协同探测平台。</p>
          </div>
        </article>
        <article class="osa-media-card">
          <img :src="withBase('/association/robot-dog.webp')" alt="协会机器人狗项目原型" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">ROS</span>
            <h3>智能机器狗</h3>
            <p>围绕感知、运动与 ROS 系统集成开展机器人实践。</p>
          </div>
        </article>
        <article class="osa-media-card">
          <img :src="withBase('/association/smart-car-track.webp')" alt="协会智能循迹小车在赛道上运行" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">运动控制</span>
            <h3>智能循迹小车</h3>
            <p>从传感器、电机驱动到控制算法，完成整车联调。</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">协会活动</p>
          <h2>训练、竞赛与分享，共同构成协会日常</h2>
        </div>
        <a class="osa-text-link" :href="withBase('/association/activities')">
          查看活动记录
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
      </div>
      <div class="osa-activity-list">
        <article class="osa-activity-row">
          <img :src="withBase('/association/osa-cup.webp')" alt="OSA 杯现场的硬件调试" width="1400" height="1050" loading="lazy" decoding="async">
          <div>
            <span><CircuitBoard :size="16" aria-hidden="true" /> 实践竞赛</span>
            <h3>OSA 杯</h3>
            <p>用题目检验学习成果，在限时实践中完成焊接、调试和程序设计。</p>
          </div>
        </article>
        <article class="osa-activity-row">
          <img :src="withBase('/association/community-demo.webp')" alt="社区儿童观看智能小车演示" width="1400" height="933" loading="lazy" decoding="async">
          <div>
            <span><HeartHandshake :size="16" aria-hidden="true" /> 科技志愿</span>
            <h3>智绘童梦，械享科技</h3>
            <p>协会成员走进社区，通过机器人演示与互动体验分享工程乐趣。</p>
          </div>
        </article>
        <article class="osa-activity-row">
          <img :src="withBase('/association/hands-on-soldering.webp')" alt="协会成员进行焊接与硬件调试培训" width="1400" height="1050" loading="lazy" decoding="async">
          <div>
            <span><CalendarDays :size="16" aria-hidden="true" /> 日常培训</span>
            <h3>从讲解到动手</h3>
            <p>以线下教学、任务练习和同伴协作为核心，持续开展基础与竞赛培训。</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">开放知识库</p>
        <h2>课程讲义、开发手册与项目资料，按方向整理</h2>
        <p>找得到的资料直接提供阅读与下载；尚未收录的内容会明确标注“暂无资料”。</p>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/library/')"><BookOpen :size="19" aria-hidden="true" /> 浏览全部资料</a>
        <a class="osa-button osa-button-outline" :href="withBase('/association/')"><UsersRound :size="19" aria-hidden="true" /> 了解协会</a>
      </div>
    </div>
  </section>
</main>
