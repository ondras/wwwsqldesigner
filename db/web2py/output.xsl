<?xml version="1.0" encoding="us-ascii"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="text"/>
  <!-- this code is not used in template but anyway it can be used someday so i left it to be ;)-->
  <xsl:template name="replace-substring">
    <xsl:param name="value"/>
    <xsl:param name="from"/>
    <xsl:param name="to"/>
    <xsl:choose>
      <xsl:when test="contains($value,$from)">
        <xsl:value-of select="substring-before($value,$from)"/>
        <xsl:value-of select="$to"/>
        <xsl:call-template name="replace-substring">
          <xsl:with-param name="value" select="substring-after($value,$from)"/>
          <xsl:with-param name="from" select="$from"/>
          <xsl:with-param name="to" select="$to"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$value"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
    <!-- return length of element-->
  <xsl:template name="getsize">
    <xsl:param name="invalue"/>
    <xsl:choose>
      <xsl:when test="contains($invalue,'(')">
        <xsl:variable name="part" select="substring-after($invalue,'(')"/>
        <xsl:value-of select="substring-before($part,')')"/>
       </xsl:when>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="/sql">
    <xsl:text>"""
just copy paste this code into your model and replace dbOBJECT to something
you prefer or what is used in your code, another thing that should be known is that
this code still cannot distinguish what exactly should be in reference title - name
when you use generic appadmin so please remove all fiealds you don't need not require 
"""
"""
database class object creation
"""
dbOBJECT = SQLDB("sqlite://dbOBJECT.db")
</xsl:text>
    <xsl:for-each select="table">
      <xsl:text>
"""
Table definition
"""
dbOBJECT.define_table("</xsl:text>
      <xsl:value-of select="@name"/>
      <xsl:text>",</xsl:text>
      <xsl:for-each select="row">
        <xsl:choose>
          <xsl:when test="not(@name = 'id')">
            <xsl:text>
      SQLField("</xsl:text>
            <xsl:choose>
              <xsl:when test="not (relation)">
                <xsl:value-of select="@name"/>
                <xsl:text>", </xsl:text>
                <!--<xsl:value-of select="datatype"/>-->
                <xsl:choose>
                  <xsl:when test="contains(datatype,'(')">
                    <xsl:text>"</xsl:text>
                    <xsl:value-of select="substring-before(datatype,'(')"/>
                    <xsl:text>", length=</xsl:text>
                    <xsl:call-template name="getsize">
                      <xsl:with-param name="invalue" select="datatype"/>
                    </xsl:call-template>
                <xsl:text>, </xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>"</xsl:text>
                      <xsl:value-of select="datatype"/>
                    <xsl:text>", </xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="@null = 0">
                  <xsl:text>notnull=True, </xsl:text>
                </xsl:if>
                <xsl:choose>
                  <xsl:when test="default">
                    <xsl:text>default='</xsl:text>
                    <xsl:value-of select="default"/>
                    <xsl:text>'</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>default=None</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="@name"/>
                <xsl:text>", dbOBJECT.</xsl:text>
                <xsl:for-each select="relation">
                  <xsl:value-of select="@table"/>
                </xsl:for-each>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
        </xsl:choose>
        <xsl:if test="not (@name = 'id')">
          <xsl:text>)</xsl:text>
        </xsl:if>
        <xsl:if test="not (position()=last())">
          <xsl:if test="not (@name = 'id')">
            <xsl:text>,</xsl:text>
          </xsl:if>
        </xsl:if>
      </xsl:for-each>
      <!-- keys -->
      <!-- maybe something else except unique??-->
      <xsl:for-each select="key">
        <xsl:choose>
          <xsl:when test="@type = 'UNIQUE'">unique=True</xsl:when>
        </xsl:choose>
      </xsl:for-each>
      <xsl:text>)</xsl:text>
      <xsl:text>

</xsl:text>
    </xsl:for-each>
<!-- fk -->
<xsl:text>
"""
Relations between tables (remove fields you don't need from requires)
"""
</xsl:text>
<!-- 
dbOBJECT.druga.prva_id.requires=IS_IN_DB(dbOBJECT, 'prva.id')
-->
    <xsl:for-each select="table">
      <xsl:for-each select="row">
        <xsl:for-each select="relation">
          <xsl:variable name="tablename"><xsl:value-of select="@table"/></xsl:variable>
          <xsl:text>dbOBJECT.</xsl:text>
            <xsl:value-of select="../../@name"/>
            <xsl:text>.</xsl:text>
            <xsl:value-of select="../@name"/>
            <xsl:text>.requires=IS_IN_DB(</xsl:text>
            <xsl:text>dbOBJECT, '</xsl:text>
            <xsl:value-of select="@table"/>
            <xsl:text>.id</xsl:text><!-- hardcoded as this is expected from web2py every table to have anyway :) -->
            <xsl:for-each select="//table"><!-- have to do this way to find our table->row->names-->
              <xsl:if test="@name = $tablename">
                  <xsl:for-each select="row">
                     <xsl:if test="not(@name = 'id')">
                        <xsl:text>','</xsl:text>
                        <xsl:value-of select="$tablename"/>
                        <xsl:text>.</xsl:text>
                        <xsl:value-of select="@name"/>
                    </xsl:if>
                  </xsl:for-each>
              </xsl:if>
            </xsl:for-each>
            <xsl:text>')
</xsl:text>
          </xsl:for-each>
        </xsl:for-each>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>