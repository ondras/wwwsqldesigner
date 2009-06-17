<?xml version="1.0" encoding="us-ascii"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="text"/>

    <!-- Return length of element-->
    <xsl:template name="getsize">
        <xsl:param name="invalue"/>
        <xsl:choose>
            <xsl:when test="contains($invalue,'(')">
                <xsl:variable name="part" select="substring-after($invalue,'(')"/>
                <xsl:value-of select="substring-before($part,')')"/>
            </xsl:when>
        </xsl:choose>
    </xsl:template>

    <!-- This is the root of output -->
    <xsl:template match="/sql">
        <xsl:text>db_engine = sa.create_engine('sqlite:///db.sqlite')&#xa;</xsl:text>
        <xsl:text>metadata = sa.MetaData()&#xa;</xsl:text>
        <!-- Use a table template to make the SA table object -->
        <xsl:apply-templates select="table" />
        <xsl:text>&#xa;</xsl:text>

        <!-- Construct the mapping objects -->
        <xsl:text>&#xa;&#xa;# Mapping Objects</xsl:text>

        <xsl:for-each select="table">
            <xsl:text>&#xa;</xsl:text>
            <xsl:text>class </xsl:text>
            <xsl:value-of select="@name"/>
            <xsl:text>():&#xa;</xsl:text>
            <xsl:text>    def __init__(self</xsl:text>
            <xsl:for-each select="row">
                <xsl:text>, </xsl:text>
                <xsl:value-of select="@name"/>
            </xsl:for-each>
            <xsl:text>):&#xa;</xsl:text>
            <xsl:for-each select="row">
                <xsl:text>        self.</xsl:text>
                <xsl:value-of select="@name"/>
                <xsl:text> = </xsl:text>
                <xsl:value-of select="@name"/>
                <xsl:text>&#xa;</xsl:text>
            </xsl:for-each>
            <xsl:text>&#xa;</xsl:text>
            <xsl:text>    def __repr__(self):&#xa;</xsl:text>
            <xsl:text>        return "&lt;</xsl:text>
            <xsl:value-of select="@name"/>
            <xsl:text>(</xsl:text>
            <xsl:for-each select="row">
                <xsl:text>'%s'</xsl:text>
                <xsl:if test="not (position()=last())">
                    <xsl:text>, </xsl:text>
                </xsl:if>

            </xsl:for-each>
            <xsl:text>)>" % (</xsl:text>
            <xsl:for-each select="row">
                <xsl:text>self.</xsl:text>
                <xsl:value-of select="@name"/>
                <xsl:if test="not (position()=last())">
                    <xsl:text>, </xsl:text>
                </xsl:if>
            </xsl:for-each>
            <xsl:text>)&#xa;</xsl:text>
        </xsl:for-each>

        <!-- Mapping the tables to the objects -->
        <xsl:text>&#xa;&#xa;# Declare mappings</xsl:text>

        <xsl:for-each select="table">
            <xsl:text>&#xa;mapper(</xsl:text>
            <xsl:value-of select="@name"/>
            <xsl:text>, </xsl:text>
            <xsl:value-of select="@name"/>
            <xsl:text>_table)</xsl:text>
        </xsl:for-each>

        <!-- Create a session to manage the objects -->
        <xsl:text>&#xa;&#xa;# Create a session</xsl:text>
        <xsl:text>&#xa;session = sessionmaker(bind=db_engine)&#xa;</xsl:text>

    </xsl:template>
    
    <!-- What a Table look like -->
    <xsl:template match="table">
        <xsl:variable name="keys" select="''" />
        <!-- First place the header -->
        <xsl:text>&#xa;</xsl:text> <!-- Newline -->
        <xsl:text>&#xa;# Table definition - </xsl:text><xsl:value-of select="@name"/>
        <xsl:text>&#xa;# </xsl:text><xsl:value-of select="./comment"/>
        <xsl:text>&#xa;</xsl:text>
        <xsl:value-of select="@name"/>
        <xsl:text>_table = sa.Table("</xsl:text>
        <xsl:value-of select="@name"/>
        <xsl:text>", metadata,</xsl:text>
        <!-- Next iterate over the Columns -->
        <xsl:apply-templates select="row"/>
        <!-- Finish the table -->
        <xsl:text>)</xsl:text>
    </xsl:template>

    <xsl:template match="row">
        <xsl:text>&#xa;</xsl:text> <!-- Newline -->
        <xsl:if test="comment">
            <xsl:text>    </xsl:text> <!-- Pretty indentation -->
        </xsl:if>
        <xsl:apply-templates select="comment"/>
        <xsl:text>    </xsl:text>
        <xsl:text>sa.Column('</xsl:text>
        <xsl:value-of select="@name"/>
        <xsl:variable name="rowname" select="@name" />
        <xsl:text>'</xsl:text>
        <!-- Add params for child nodes -->
        <xsl:apply-templates select="datatype"/>
        <xsl:apply-templates select="relation"/>
        <!-- Add params for node params -->
        <xsl:if test="@null='1'">
            <xsl:text>, nullable=True</xsl:text>
        </xsl:if>
        <xsl:if test="@autoincrement='1'">
<!--            <xsl:if test="datatype='sa.Integer'"> --> <!-- I'd like to make this type specific, but I can't seem to get it to work right. -->
                <xsl:text>, autoincrement=True</xsl:text>
<!--            </xsl:if> -->
        </xsl:if>
        <!-- Add other params -->
        <xsl:for-each select="../key[@type='PRIMARY']/part">
            <xsl:if test="$rowname = text()">, primary_key=True</xsl:if>
        </xsl:for-each>

        <!-- Finish the row -->
        <xsl:text>)</xsl:text>
        <xsl:if test="not (position()=last())">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>

    <xsl:template match="datatype">
        <xsl:text>, </xsl:text>
        <xsl:choose>
            <xsl:when test="contains(. ,'(')">
                <xsl:value-of select="substring-before(. ,'(')"/>
                <xsl:if test=".='sa.String'">
                    <xsl:text>, length=</xsl:text>
                    <xsl:call-template name="getsize">
                        <xsl:with-param name="invalue" select="."/>
                    </xsl:call-template>
                </xsl:if>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="."/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="relation">
        <xsl:text>, sa.ForeignKey("</xsl:text>
        <xsl:value-of select="@table" />
        <xsl:text>.</xsl:text>
        <xsl:value-of select="@row" />
        <xsl:text>")</xsl:text>
    </xsl:template>

    <xsl:template match="comment">
        <xsl:text># </xsl:text>
        <xsl:value-of select="../@name"/>
        <xsl:text> - </xsl:text>
        <xsl:value-of select="." />
        <xsl:text>&#xa;</xsl:text>
    </xsl:template>
    
</xsl:stylesheet>