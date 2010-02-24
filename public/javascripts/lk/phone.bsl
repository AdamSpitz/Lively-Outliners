<if name=url.orig glob=*background_*>
  <dequeue name=out prepend=q. timelimit=30>
  <debug line=${q.line}>
  {
  <foreach name=i glob=q.*> <get delim>"<get i.name.1>": "<get i.value>"
    <set namespace=local name=delim value=,>
  </foreach>
  }
  <abort>
</if>
<debug params=${headers.query}>
<if query.nocontent>
  <addheader nocontent>
</if>

<if query.server>
  <debug starting app>
  <enqueue name=out data="msg=resetting-phone-connection">
  <if name=query.username>
    <enqueue name=out data=msg#starting-app>
    <pipe command=${cli_phone#./iaxcli-Darwin-i386} stdinQ=in stdoutQ=out debug=true>
    <set namespace=local name=line value="r ${query.username} ${query.password} ${query.server}">
    <enqueue name=out data="msg=registration_requested">
    <debug enqueueing=${line}>
    <enqueue name=in data=line>

    <set namespace=local name=line value="s f 5"> <!-- initial filters -->
    <enqueue name=in data=line>

    <set name=user value=${query.username}>
    <set name=pass value=${query.password}>
    <set name=server value=${query.server}>
  <else>
    <enqueue name=out data="error#no_username:_connection_terminated">
  </if>
  <abort>
</if>

<!-- send a command to the phone -->

<if query.cmd>
  <set namespace=local name=line value=${query.cmd}>
  <debug "running command: ${query.cmd}">
  <enqueue name=in data=line>
  <abort>
</if>

<if name=query.submit value="dial">
    <if not name=query.number match="^[0-9]+$"> <!-- temporary -->
      <set namespace=local name=line value=${query.number}>
      <enqueue name=out data=query.number>
      <enqueue name=in data=line>
      <abort>
    </if>
    <if not name=user>
      <enqueue name=out data="error#Not-registered">
      <abort>
    </if>
    <set namespace=local name=line value="d ${user}:${pass}@${server}/${query.number}">
    <debug enqueueing=${line}>
    <enqueue name=out data=line>
    <enqueue name=in data=line>
    <abort>
</if>

<if name=query.submit match="dialing|hangup">
  <enqueue name=in data=line#h>
  <abort>
</if>

<if name=query.submit match="answer">
  <enqueue name=in data=line#a>
  <debug answering the call>
  <abort>
</if>
